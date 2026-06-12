import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { usePropertyStore, type NewPropertyInput } from '../stores/usePropertyStore';
import { PROPERTY_TYPE_LABELS, PRICE_TYPE_LABELS, FURNISHING_LABELS } from '../lib/constants';
import type { PriceType, PropertyType, FurnishingType } from '../types';

const empty = {
  title: '', description: '', price: '', price_type: 'sale' as PriceType,
  property_type: 'apartment' as PropertyType, address: '', locality: '',
  latitude: '', longitude: '', area_sqft: '', bedrooms: '', bathrooms: '',
  furnishing: '' as FurnishingType | '',
};

export default function SellPropertyPage() {
  const navigate = useNavigate();
  const { createProperty } = usePropertyStore();
  const [form, setForm] = useState(empty);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof empty>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data: NewPropertyInput = {
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        price_type: form.price_type,
        property_type: form.property_type,
        address: form.address,
        locality: form.locality || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        area_sqft: form.area_sqft ? parseFloat(form.area_sqft) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        furnishing: form.furnishing || null,
      };
      const prop = await createProperty(data, photoFiles, videoFiles);
      navigate(`/property/${prop.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to list property');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <h1 className="section-title mb-2">List Your Property</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add details and photos/videos. Your listing goes live immediately.</p>
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. 3BHK Apartment on Rajpur Road" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="input min-h-[90px]" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe your property..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (INR) *</label>
            <input className="input" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Listing Type *</label>
            <select className="select" value={form.price_type} onChange={(e) => set({ price_type: e.target.value as PriceType })}>
              {Object.entries(PRICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Property Type *</label>
            <select className="select" value={form.property_type} onChange={(e) => set({ property_type: e.target.value as PropertyType })}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Furnishing</label>
            <select className="select" value={form.furnishing} onChange={(e) => set({ furnishing: e.target.value as FurnishingType | '' })}>
              <option value="">Any</option>
              {Object.entries(FURNISHING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address *</label>
            <input className="input" value={form.address} onChange={(e) => set({ address: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Locality</label>
            <input className="input" value={form.locality} onChange={(e) => set({ locality: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area (sq.ft.)</label>
            <input className="input" type="number" value={form.area_sqft} onChange={(e) => set({ area_sqft: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input className="input" type="number" value={form.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input className="input" type="number" value={form.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input className="input" type="number" step="any" value={form.latitude} onChange={(e) => set({ latitude: e.target.value })} placeholder="30.3165" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input className="input" type="number" step="any" value={form.longitude} onChange={(e) => set({ longitude: e.target.value })} placeholder="78.0322" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Photos</label>
            <label className="btn-secondary cursor-pointer text-sm inline-flex">
              <Upload className="w-4 h-4" /> Choose Photos
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} />
            </label>
            {photoFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photoFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button type="button" onClick={() => setPhotoFiles((p) => p.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Videos</label>
            <label className="btn-secondary cursor-pointer text-sm inline-flex">
              <Upload className="w-4 h-4" /> Choose Videos
              <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => setVideoFiles(Array.from(e.target.files || []))} />
            </label>
            {videoFiles.length > 0 && <p className="text-sm text-slate-500 mt-2">{videoFiles.length} video(s) selected</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Publishing...' : 'Publish Listing'}</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
