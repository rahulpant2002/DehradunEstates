import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Loader2, Trash2, Users, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { formatPrice, timeAgo } from '../lib/utils';
import { PROPERTY_TYPE_LABELS } from '../lib/constants';
import type { Property, Interest } from '../types';

export default function MyListingsPage() {
  const { fetchMyListings, fetchListingInterests, deleteProperty } = usePropertyStore();
  const [listings, setListings] = useState<Property[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [l, i] = await Promise.all([fetchMyListings(), fetchListingInterests()]);
      setListings(l);
      setInterests(i);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fetchMyListings, fetchListingInterests]);

  const interestsFor = (propertyId: string) => interests.filter((i) => i.property_id === propertyId);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing and its media permanently?')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteProperty(id);
      setListings((prev) => prev.filter((p) => p.id !== id));
      setInterests((prev) => prev.filter((i) => i.property_id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">My Listings</h1>
        <Link to="/sell" className="btn-primary text-sm"><Plus className="w-4 h-4" /> List Property</Link>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : listings.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">You haven't listed any properties yet</p>
          <Link to="/sell" className="btn-primary mt-4 text-sm">List Your First Property</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((p) => {
            const leads = interestsFor(p.id);
            const open = expanded === p.id;
            return (
              <div key={p.id} className="card overflow-hidden">
                <div className="p-3 flex items-center gap-3">
                  <Link to={`/property/${p.id}`} className="shrink-0">
                    <img src={p.media?.find((m) => m.media_type === 'photo')?.url || ''} alt="" className="w-20 h-14 object-cover rounded bg-surface-100 dark:bg-surface-800" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/property/${p.id}`} className="font-medium truncate block hover:text-primary-600">{p.title}</Link>
                    <p className="text-xs text-slate-500">{formatPrice(p.price, p.price_type)} · {PROPERTY_TYPE_LABELS[p.property_type]}</p>
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : p.id)}
                    className={`btn-secondary text-xs flex items-center gap-1 ${leads.length ? 'border-primary-500 text-primary-600 dark:text-primary-400' : ''}`}
                  >
                    <Users className="w-4 h-4" /> {leads.length} interested
                    {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="btn-danger text-xs">
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-surface-50 dark:bg-surface-900/40 p-3">
                    {leads.length === 0 ? (
                      <p className="text-sm text-slate-500">No one has shown interest yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {leads.map((i) => (
                          <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="font-medium">{i.profiles?.full_name || 'Interested buyer'}</span>
                            {i.profiles?.phone && (
                              <a href={`tel:${i.profiles.phone}`} className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"><Phone className="w-3.5 h-3.5" />{i.profiles.phone}</a>
                            )}
                            {i.profiles?.email && (
                              <a href={`mailto:${i.profiles.email}`} className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"><Mail className="w-3.5 h-3.5" />{i.profiles.email}</a>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">{timeAgo(i.created_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
