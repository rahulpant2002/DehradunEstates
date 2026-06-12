import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Heart, Play } from 'lucide-react';
import type { Property } from '../types';
import { formatPrice, formatArea, timeAgo } from '../lib/utils';
import { PROPERTY_TYPE_LABELS, PRICE_TYPE_LABELS } from '../lib/constants';

interface PropertyCardProps {
  property: Property;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export default function PropertyCard({ property, onSave, isSaved }: PropertyCardProps) {
  const coverPhoto = property.media?.find((m) => m.media_type === 'photo');
  const hasVideo = property.media?.some((m) => m.media_type === 'video');

  return (
    <Link to={`/property/${property.id}`} className="card-hover group flex flex-col overflow-hidden animate-fade-in">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-surface-800">
        {coverPhoto ? (
          <img src={coverPhoto.url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
            <Maximize className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge bg-primary-600 text-white text-[11px]">{PRICE_TYPE_LABELS[property.price_type]}</span>
          <span className="badge bg-white/90 dark:bg-surface-900/90 text-slate-700 dark:text-slate-200 text-[11px]">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
        </div>
        {hasVideo && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-black/60 text-white text-[11px] flex items-center gap-1"><Play className="w-3 h-3" /> Video</span>
          </div>
        )}
        {property.status === 'sold' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="badge bg-red-600 text-white text-sm px-3 py-1">SOLD</span>
          </div>
        )}
        {property.featured && property.status !== 'sold' && (
          <div className="absolute bottom-3 left-3">
            <span className="badge bg-accent-500 text-white text-[11px]">Featured</span>
          </div>
        )}
        {onSave && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(property.id); }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-surface-900/80 hover:bg-white dark:hover:bg-surface-900 transition-colors">
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`} />
          </button>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{property.title}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{timeAgo(property.created_at)}</span>
        </div>
        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatPrice(property.price, property.price_type)}</p>
        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.address}, {property.city}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mt-1">
          {property.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{property.bedrooms}</span>}
          {property.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</span>}
          {property.area_sqft != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{formatArea(property.area_sqft)}</span>}
        </div>
      </div>
    </Link>
  );
}
