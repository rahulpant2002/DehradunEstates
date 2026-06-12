import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, Building2, LogOut, ShoppingBag, Tag, Plus } from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useState } from 'react';

export default function Header() {
  const { theme, toggle } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Building2 className="w-7 h-7" />
          <span className="text-xl font-bold tracking-tight">DehradunEstates</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="btn-ghost text-sm">Home</Link>
          <Link to="/properties" className="btn-ghost text-sm">Properties</Link>
          <Link to="/search" className="btn-ghost text-sm">Browse</Link>
          {user && <Link to="/my-listings" className="btn-ghost text-sm flex items-center gap-1"><Tag className="w-4 h-4" />My Listings</Link>}
          {user && <Link to="/my-interests" className="btn-ghost text-sm flex items-center gap-1"><ShoppingBag className="w-4 h-4" />My Interests</Link>}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button type="button" onClick={toggle} className="btn-ghost p-2 rounded-full" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <>
              <Link to="/sell" className="btn-primary text-sm"><Plus className="w-4 h-4" /> Sell Property</Link>
              <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[10rem] truncate">{user.full_name || user.email}</span>
              <button type="button" onClick={handleSignOut} className="btn-ghost p-2 rounded-full text-red-500" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary text-sm">Sign In</Link>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn-ghost p-2">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start">Home</Link>
            <Link to="/properties" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start">Properties</Link>
            <Link to="/search" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start">Browse</Link>
            {user && <Link to="/sell" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start"><Plus className="w-4 h-4 inline mr-1" />Sell Property</Link>}
            {user && <Link to="/my-listings" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start"><Tag className="w-4 h-4 inline mr-1" />My Listings</Link>}
            {user && <Link to="/my-interests" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start"><ShoppingBag className="w-4 h-4 inline mr-1" />My Interests</Link>}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={toggle} className="btn-ghost p-2 rounded-full">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {user ? (
                <button type="button" onClick={handleSignOut} className="btn-ghost text-sm flex-1 text-red-500"><LogOut className="w-4 h-4 inline mr-1" /> Sign Out</button>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-primary text-sm flex-1">Sign In</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
