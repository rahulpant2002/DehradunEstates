import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password, fullName, phone);
        setNotice('Account created. You can sign in now.');
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Building2 className="w-8 h-8" />
          <span className="text-2xl font-bold">DehradunEstates</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{mode === 'signin' ? 'Welcome back' : 'Create an account to buy and sell properties'}</p>
      </div>

      <div className="card p-6">
        <div className="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-1 mb-5">
          <button onClick={() => setMode('signin')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'signin' ? 'bg-white dark:bg-surface-700 shadow-sm font-medium' : 'text-slate-500'}`}>Sign In</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'signup' ? 'bg-white dark:bg-surface-700 shadow-sm font-medium' : 'text-slate-500'}`}>Sign Up</button>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-4">{error}</div>}
        {notice && <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm mb-4">{notice}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Sign in to list your own properties and buy from others.
        </p>
      </div>
    </div>
  );
}
