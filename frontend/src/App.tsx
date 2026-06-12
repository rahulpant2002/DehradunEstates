import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AuthPage from './pages/AuthPage';
import SellPropertyPage from './pages/SellPropertyPage';
import MyListingsPage from './pages/MyListingsPage';
import MyInterestsPage from './pages/MyInterestsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const { theme } = useThemeStore();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => { initialize(); }, [initialize]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sell" element={<RequireAuth><SellPropertyPage /></RequireAuth>} />
            <Route path="/my-listings" element={<RequireAuth><MyListingsPage /></RequireAuth>} />
            <Route path="/my-interests" element={<RequireAuth><MyInterestsPage /></RequireAuth>} />
          </Routes>
        </main>
        <Footer />
        <ChatBot />
      </div>
    </BrowserRouter>
  );
}
