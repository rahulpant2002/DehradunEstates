import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, Map as MapIcon, Loader2 } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useDebounce } from '../hooks/useDebounce';
import PropertyCard from '../components/PropertyCard';
import SearchFilters from '../components/SearchFilters';
import PropertyMap from '../components/PropertyMap';
import type { PropertyFilters } from '../types';

export default function SearchPage() {
  const { properties, total, loading, fetchProperties } = usePropertyStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const geo = useGeolocation();

  const filters: PropertyFilters = useMemo(() => ({
    search: searchParams.get('search') || '',
    property_type: (searchParams.get('property_type') as any) || '',
    price_type: (searchParams.get('price_type') as any) || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    furnishing: (searchParams.get('furnishing') as any) || '',
  }), [searchParams]);

  const debouncedFilters = useDebounce(filters, 400);

  const updateFilters = useCallback((newFilters: PropertyFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) params.set(k, String(v));
    });
    setSearchParams(params);
  }, [setSearchParams]);

  useEffect(() => {
    if (searchParams.get('nearby') === 'true' && !geo.loading) {
      fetchProperties({ ...debouncedFilters, lat: geo.lat, lng: geo.lng, radius_km: 5 });
    } else {
      fetchProperties(debouncedFilters);
    }
  }, [debouncedFilters, geo.lat, geo.lng, geo.loading, fetchProperties]);

  const page = Number(searchParams.get('page') || '1');
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fade-in">
      <SearchFilters filters={filters} onChange={updateFilters} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">{loading ? 'Searching...' : `${total} properties found`}</p>
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-slate-500'}`}><MapIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {loading && properties.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : properties.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
          <p className="text-lg font-medium">No properties found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      ) : (
        <div className="space-y-5">
          <PropertyMap properties={properties} height="500px" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page <= 1} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}
