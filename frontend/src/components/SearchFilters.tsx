import { PROPERTY_TYPE_LABELS, PRICE_TYPE_LABELS, FURNISHING_LABELS } from '../lib/constants';
import type { PropertyFilters, PropertyType, PriceType, FurnishingType } from '../types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

interface SearchFiltersProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const update = (patch: Partial<PropertyFilters>) => onChange({ ...filters, ...patch });
  const hasActiveFilters = filters.property_type || filters.price_type || filters.furnishing || filters.min_price || filters.max_price || filters.bedrooms;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search properties in Dehradun..." value={filters.search || ''} onChange={(e) => update({ search: e.target.value })} />
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary flex items-center gap-1 ${hasActiveFilters ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' : ''}`}>
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.entries(PRICE_TYPE_LABELS) as [PriceType, string][]).map(([k, v]) => (
          <button key={k} onClick={() => update({ price_type: filters.price_type === k ? '' : k })}
            className={`badge cursor-pointer transition-colors ${filters.price_type === k ? 'bg-primary-600 text-white' : 'bg-surface-100 text-slate-600 dark:bg-surface-800 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-surface-700'}`}>
            {v}
          </button>
        ))}
        {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([k, v]) => (
          <button key={k} onClick={() => update({ property_type: filters.property_type === k ? '' : k })}
            className={`badge cursor-pointer transition-colors ${filters.property_type === k ? 'bg-primary-600 text-white' : 'bg-surface-100 text-slate-600 dark:bg-surface-800 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-surface-700'}`}>
            {v}
          </button>
        ))}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Min Price</label>
            <input className="input text-sm" type="number" placeholder="Min" value={filters.min_price || ''} onChange={(e) => update({ min_price: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Price</label>
            <input className="input text-sm" type="number" placeholder="Max" value={filters.max_price || ''} onChange={(e) => update({ max_price: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bedrooms</label>
            <select className="select text-sm" value={filters.bedrooms || ''} onChange={(e) => update({ bedrooms: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Furnishing</label>
            <select className="select text-sm" value={filters.furnishing || ''} onChange={(e) => update({ furnishing: e.target.value as FurnishingType | '' })}>
              <option value="">Any</option>
              {Object.entries(FURNISHING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <div className="col-span-full">
              <button onClick={() => onChange({})} className="btn-ghost text-sm text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Clear all filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
