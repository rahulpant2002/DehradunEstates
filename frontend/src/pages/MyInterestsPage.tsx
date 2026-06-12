import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Heart, MapPin } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import PropertyCard from '../components/PropertyCard';
import type { Property } from '../types';

export default function MyInterestsPage() {
  const { fetchMyInterests } = usePropertyStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setProperties(await fetchMyInterests()); }
      finally { setLoading(false); }
    })();
  }, [fetchMyInterests]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <h1 className="section-title mb-1">My Interests</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1"><MapPin className="w-4 h-4" /> Properties you've shown interest in — the sellers have your contact details.</p>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : properties.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">You haven't shown interest in any property yet</p>
          <Link to="/search" className="btn-primary mt-4 text-sm">Browse Properties</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
