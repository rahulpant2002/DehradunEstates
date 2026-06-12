import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Building2, ChevronRight, ArrowRight } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import PropertyCard from '../components/PropertyCard';
import { PROPERTY_TYPE_LABELS } from '../lib/constants';

export default function HomePage() {
  const { featured, fetchFeatured, properties, fetchProperties } = usePropertyStore();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchFeatured();
    fetchProperties({}, 1);
  }, [fetchFeatured, fetchProperties]);

  const latest = properties.slice(0, 8);

  const searchType = (type: string) => setSearchParams({ property_type: type });

  return (
    <div className="animate-fade-in">
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 dark:from-surface-950 dark:via-primary-950 dark:to-surface-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Find Your Dream Property in <span className="text-accent-300">Dehradun</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary-100 leading-relaxed max-w-2xl">
              Discover apartments, houses, villas, plots and commercial spaces across Dehradun.
              Location-based search makes finding nearby properties effortless.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="btn-accent text-base px-6 py-3"><Search className="w-5 h-5" /> Search Properties</Link>
              <Link to="/search?nearby=true" className="btn text-base px-6 py-3 bg-white/10 text-white hover:bg-white/20 border border-white/20"><MapPin className="w-5 h-5" /> Nearby Properties</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="section-title mb-8">Browse by Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {(Object.entries(PROPERTY_TYPE_LABELS) as [string, string][]).map(([key, label]) => (
            <button key={key} onClick={() => searchType(key)} className="card-hover p-5 flex flex-col items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface-100 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Featured Properties</h2>
            <Link to="/search" className="btn-ghost text-sm flex items-center gap-1 text-primary-600 dark:text-primary-400">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {featured.length === 0 ? (
            <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No featured properties to show right now.</p>
              <Link to="/search" className="btn-primary mt-4 text-sm">Browse All Properties</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Latest Listings</h2>
          <Link to="/search" className="btn-ghost text-sm flex items-center gap-1 text-primary-600 dark:text-primary-400">View all <ChevronRight className="w-4 h-4" /></Link>
        </div>
        {latest.length === 0 ? (
          <div className="card p-10 text-center text-slate-500 dark:text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No properties listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latest.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-2xl bg-gradient-to-r from-primary-700 to-accent-700 dark:from-primary-800 dark:to-accent-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Looking for Your Next Home?</h3>
            <p className="text-primary-100 mt-2 max-w-lg">Explore handpicked apartments, houses, villas, plots and commercial spaces across Dehradun.</p>
          </div>
          <Link to="/search" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold text-base px-8 py-3 whitespace-nowrap">Explore Properties <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>
    </div>
  );
}
