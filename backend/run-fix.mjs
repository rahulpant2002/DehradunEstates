// Applies backend/supabase/setup_all.sql to the Supabase Postgres database AND
// forces PostgREST to reload its schema cache (the part the dashboard keeps
// failing to do). The connection string is taken at runtime, never stored.
//
// Usage:
//   node run-fix.mjs "postgresql://postgres:PWD@db.<ref>.supabase.co:5432/postgres"
import { readFileSync } from 'node:fs';
import pg from 'pg';

const conn = process.argv[2] || process.env.DATABASE_URL;
if (!conn) {
  console.error('Missing connection string. Usage: node run-fix.mjs "<postgres-uri>"');
  process.exit(1);
}

// Non-destructive: only adds the interests table + policies (the rest of the
// schema is already applied). Then forces a cache reload.
const sql = readFileSync(new URL('./supabase/migrations/0005_interests.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

const main = async () => {
  console.log('Connecting...');
  await client.connect();

  console.log('Applying 0005_interests.sql (creates property_interests) ...');
  await client.query(sql);

  console.log('Forcing PostgREST schema-cache reload ...');
  await client.query(`notify pgrst, 'reload schema'`);
  await client.query(`notify pgrst, 'reload config'`);

  const checks = await client.query(`
    select
      (select count(*) from information_schema.columns
         where table_name='properties' and column_name='created_by')        as has_created_by,
      (select count(*) from information_schema.tables
         where table_name='property_interests')                             as has_interests,
      (select count(*) from information_schema.tables
         where table_name='purchases')                                      as has_purchases,
      (select count(*) from pg_proc where proname='purchase_property')       as has_buy_fn,
      (select count(*) from properties)                                      as property_rows
  `);
  console.log('Verification:', checks.rows[0]);
  await client.end();
  console.log('DONE. If the API is still stale after this, a one-click project restart will clear it.');
};

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
