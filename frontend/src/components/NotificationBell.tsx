import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Phone, Mail } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useAuthStore } from '../stores/useAuthStore';
import { timeAgo } from '../lib/utils';
import type { Interest } from '../types';

const SEEN_KEY = 'notifLastSeen';

export default function NotificationBell() {
  const { user } = useAuthStore();
  const { fetchListingInterests } = usePropertyStore();
  const [items, setItems] = useState<Interest[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => Number(localStorage.getItem(SEEN_KEY) || 0));
  const ref = useRef<HTMLDivElement>(null);

  const load = () => { fetchListingInterests().then(setItems).catch(() => {}); };

  // Load when signed in; refresh periodically so new interest shows up.
  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const unread = items.filter((i) => new Date(i.created_at).getTime() > lastSeen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setLastSeen(now);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={toggle} className="btn-ghost p-2 rounded-full relative" aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 shadow-xl z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-sm">Notifications</div>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No one has shown interest in your listings yet.</p>
          ) : (
            <ul>
              {items.map((i) => (
                <li key={i.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-medium">{i.profiles?.full_name || 'Someone'}</span> is interested in{' '}
                    <Link to={`/property/${i.property_id}`} onClick={() => setOpen(false)} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {i.properties?.title || 'your property'}
                    </Link>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {i.profiles?.phone && <a href={`tel:${i.profiles.phone}`} className="flex items-center gap-1 hover:text-primary-600"><Phone className="w-3 h-3" />{i.profiles.phone}</a>}
                    {i.profiles?.email && <a href={`mailto:${i.profiles.email}`} className="flex items-center gap-1 hover:text-primary-600"><Mail className="w-3 h-3" />{i.profiles.email}</a>}
                    <span className="ml-auto">{timeAgo(i.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
