import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Share2, Phone, Mail, Play, ChevronLeft, Calendar, ShoppingBag, CheckCircle2, Trash2 } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useAuthStore } from '../stores/useAuthStore';
import PropertyMap from '../components/PropertyMap';
import { formatPrice, formatArea, timeAgo, cn } from '../lib/utils';
import { PROPERTY_TYPE_LABELS, PRICE_TYPE_LABELS, FURNISHING_LABELS } from '../lib/constants';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, fetchById, expressInterest, hasMyInterest, deleteProperty } = usePropertyStore();
  const { user } = useAuthStore();
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [interested, setInterested] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) fetchById(id); }, [id, fetchById]);

  const isOwner = !!user && !!current && user.id === current.created_by;

  // Check whether this user has already expressed interest.
  useEffect(() => {
    if (user && id && !isOwner) {
      hasMyInterest(id).then(setInterested);
    }
  }, [user, id, isOwner, hasMyInterest]);

  if (!current) return null;

  const photos = current.media?.filter((m) => m.media_type === 'photo') || [];
  const videos = current.media?.filter((m) => m.media_type === 'video') || [];
  const coverPhoto = photos[0]?.url;

  const handleBuy = async () => {
    if (!user) { navigate('/auth'); return; }
    setBuyError('');
    setSending(true);
    try {
      await expressInterest(current.id);
      setInterested(true);
    } catch (err: any) {
      if (/already expressed/i.test(err.message || '')) setInterested(true);
      else setBuyError(err.message || 'Could not send your interest');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently?')) return;
    setDeleting(true);
    try {
      await deleteProperty(current.id);
      navigate('/my-listings');
    } catch (err: any) {
      setBuyError(err.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-4 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-surface-800">
            {activeMedia ? (
              activeMedia.endsWith('.mp4') || activeMedia.endsWith('.webm') ? (
                <video src={activeMedia} controls className="w-full h-full object-cover" />
              ) : (<img src={activeMedia} alt="" className="w-full h-full object-cover" />)
            ) : coverPhoto ? (
              <img src={coverPhoto} alt={current.title} className="w-full h-full object-cover" />
            ) : (<div className="w-full h-full flex items-center justify-center text-slate-400"><Maximize className="w-16 h-16" /></div>)}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="badge bg-primary-600 text-white">{PRICE_TYPE_LABELS[current.price_type]}</span>
              <span className="badge bg-white/90 dark:bg-surface-900/90 text-slate-700 dark:text-slate-200">{PROPERTY_TYPE_LABELS[current.property_type]}</span>
            </div>
          </div>

          {current.media && current.media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {photos.map((m) => (
                <button key={m.id} onClick={() => setActiveMedia(m.url)} className={cn('flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors', activeMedia === m.url ? 'border-primary-500' : 'border-transparent')}>
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {videos.map((m) => (
                <button key={m.id} onClick={() => setActiveMedia(m.url)} className={cn('flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 bg-slate-200 dark:bg-surface-700 flex items-center justify-center transition-colors', activeMedia === m.url ? 'border-primary-500' : 'border-transparent')}>
                  <Play className="w-5 h-5 text-slate-500" />
                </button>
              ))}
            </div>
          )}

          <div className="card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{current.title}</h1>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1"><MapPin className="w-4 h-4" /><span>{current.address}{current.locality ? `, ${current.locality}` : ''}, {current.city}</span></div>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(current.price, current.price_type)}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-700">
              {current.bedrooms != null && (<div className="flex items-center gap-2"><Bed className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Bedrooms</p><p className="font-semibold">{current.bedrooms}</p></div></div>)}
              {current.bathrooms != null && (<div className="flex items-center gap-2"><Bath className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Bathrooms</p><p className="font-semibold">{current.bathrooms}</p></div></div>)}
              {current.area_sqft != null && (<div className="flex items-center gap-2"><Maximize className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Area</p><p className="font-semibold">{formatArea(current.area_sqft)}</p></div></div>)}
              <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-slate-400" /><div><p className="text-xs text-slate-500">Listed</p><p className="font-semibold text-sm">{timeAgo(current.created_at)}</p></div></div>
            </div>

            {current.furnishing && (<div className="text-sm"><span className="text-slate-500 mr-2">Furnishing:</span><span className="font-medium">{FURNISHING_LABELS[current.furnishing]}</span></div>)}
            {current.description && (<div><h3 className="font-semibold mb-2">Description</h3><p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{current.description}</p></div>)}
          </div>

          {current.location && (<div><h3 className="font-semibold mb-3">Location</h3><PropertyMap properties={[current]} center={current.location} zoom={15} height="300px" /></div>)}
        </div>

        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Price</span>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(current.price, current.price_type)}</span>
            </div>
            {isOwner ? (
              <>
                <p className="text-xs text-slate-400">This is your listing. Interested buyers appear under <span className="font-medium">My Listings</span>.</p>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger w-full text-sm">
                  <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete Listing'}
                </button>
              </>
            ) : interested ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" /> You've shown interest — the seller has been notified and can see your contact details.
              </div>
            ) : (
              <button onClick={handleBuy} disabled={sending} className="btn-primary w-full text-sm">
                <ShoppingBag className="w-4 h-4" /> {sending ? 'Sending...' : user ? 'Buy this Property' : 'Sign in to Buy'}
              </button>
            )}
            {!isOwner && !interested && (
              <p className="text-xs text-slate-400">Clicking Buy notifies the seller of your interest so they can contact you.</p>
            )}
            {buyError && <p className="text-sm text-red-600 dark:text-red-400">{buyError}</p>}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold">Contact Owner</h3>
            {current.profiles && (
              <div className="space-y-2">
                <p className="font-medium">{current.profiles.full_name || 'Property Owner'}</p>
                {current.profiles.phone && (<a href={`tel:${current.profiles.phone}`} className="btn-primary w-full text-sm"><Phone className="w-4 h-4" /> {current.profiles.phone}</a>)}
                <a href={`mailto:${current.profiles.email}`} className="btn-outline w-full text-sm"><Mail className="w-4 h-4" /> Send Email</a>
              </div>
            )}
          </div>

          <div className="card p-5">
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="btn-secondary w-full text-sm"><Share2 className="w-4 h-4" /> Copy Link</button>
          </div>
        </div>
      </div>
    </div>
  );
}
