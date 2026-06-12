import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-900 dark:bg-surface-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-white mb-3">
              <Building2 className="w-6 h-6 text-primary-400" />
              <span className="text-lg font-bold">DehradunEstates</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Your trusted partner for finding the perfect property in Dehradun.
              Apartments, houses, villas, plots and commercial spaces.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Browse Properties</Link></li>
              <li><Link to="/search?price_type=rent" className="hover:text-white transition-colors">For Rent</Link></li>
              <li><Link to="/search?price_type=sale" className="hover:text-white transition-colors">For Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Property Types</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search?property_type=apartment" className="hover:text-white transition-colors">Apartments</Link></li>
              <li><Link to="/search?property_type=house" className="hover:text-white transition-colors">Houses</Link></li>
              <li><Link to="/search?property_type=villa" className="hover:text-white transition-colors">Villas</Link></li>
              <li><Link to="/search?property_type=plot" className="hover:text-white transition-colors">Plots</Link></li>
              <li><Link to="/search?property_type=commercial" className="hover:text-white transition-colors">Commercial</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Dehradun, Uttarakhand</li>
              <li>India - 248001</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DehradunEstates. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
