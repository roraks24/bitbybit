'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AuthProvider } from '@/lib/auth';
import ThemeToggle from '@/components/ui/ThemeToggle';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push(user.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (status === 404) {
        setError('No account found with this email. Please register first.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check if the server is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)', transition: 'background 0.4s ease' }}>
      <ThemeToggle />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, var(--cyan), transparent)' }} />
      </div>

      <div className="w-full max-w-md relative anim-h1">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="var(--cyan)" strokeWidth="2.5" fill="var(--cyan-dim)" />
            <rect x="14" y="14" width="12" height="12" rx="1.5" transform="rotate(45 20 20)" stroke="var(--cyan)" strokeWidth="2" fill="none" />
          </svg>
          <span className="text-[13px] font-bold tracking-[0.15em]" style={{ color: 'var(--cyan)' }}>TRUSTLAYER</span>
        </Link>

        <div className="glass-card rounded-2xl p-8 neon-border">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-main)' }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-6"
              style={{ background: 'var(--badge-failed-bg)', border: '1px solid var(--badge-failed-border)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--badge-failed-text)' }} />
              <p className="text-xs" style={{ color: 'var(--badge-failed-text)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-quantum has-icon"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-quantum has-icon"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link href="/register" style={{ color: 'var(--cyan)' }} className="hover:opacity-80 transition-opacity">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
