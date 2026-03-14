'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, AlertCircle, Loader2, Briefcase, Code2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import ThemeToggle from '@/components/ui/ThemeToggle';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'employer';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      router.push(user.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (status === 409) {
        setError('An account with this email already exists. Please login instead.');
      } else if (status === 400) {
        setError('Please fill in all required fields correctly.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check if the server is running.');
      } else {
        setError('Registration failed. Please try again.');
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
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 border-[1.5px] border-[var(--cyan)]"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: 'var(--cyan-dim)' }} />
          <span className="text-[13px] font-bold tracking-[0.15em]" style={{ color: 'var(--cyan)' }}>TRUSTLAYER</span>
        </Link>

        <div className="glass-card rounded-2xl p-8 neon-border">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-main)' }}>Create account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join the autonomous trust network</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { value: 'employer', icon: Briefcase, label: 'Employer', desc: 'Post projects' },
              { value: 'freelancer', icon: Code2, label: 'Freelancer', desc: 'Earn & build PFI' },
            ].map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className="p-3 rounded-xl border text-left transition-all duration-200"
                style={{
                  borderColor: form.role === value ? 'var(--card-hover-border)' : 'var(--card-border)',
                  background: form.role === value ? 'var(--cyan-dim)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4 mb-1.5" style={{ color: form.role === value ? 'var(--cyan)' : 'var(--text-muted)' }} />
                <p className="text-xs font-semibold" style={{ color: form.role === value ? 'var(--cyan)' : 'var(--text-main)' }}>{label}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{ background: 'var(--badge-failed-bg)', border: '1px solid var(--badge-failed-border)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--badge-failed-text)' }} />
              <p className="text-xs" style={{ color: 'var(--badge-failed-text)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-quantum has-icon"
                  placeholder="Alex Chen"
                  required
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--cyan)' }} className="hover:opacity-80 transition-opacity">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthProvider>
  );
}
