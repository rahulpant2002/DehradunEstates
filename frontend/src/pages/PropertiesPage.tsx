import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import PropertyCard from '../components/PropertyCard';

const PAGE_SIZE = 20;

export default function PropertiesPage() {
  const { properties, total, loading, fetchProperties } = usePropertyStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || '1');

  useEffect(() => { fetchProperties({}, page); }, [fetchProperties, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goTo = (p: number) => setSearchParams(p > 1 ? { page: String(p) } : {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-title">All Properties</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'property' : 'properties'} listed`}
          </p>
        </div>
      </div>

      {loading && properties.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : properties.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No properties listed yet</p>
          <p className="text-sm mt-1">Listings added by the admin will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => goTo(page - 1)} disabled={page <= 1} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => goTo(page + 1)} disabled={page >= totalPages} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}
