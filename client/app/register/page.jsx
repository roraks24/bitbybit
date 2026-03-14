'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, User, AlertCircle, Loader2, Briefcase, Code2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';

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
    <div className="min-h-screen bg-[#020408] quantum-grid flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-display font-bold text-base tracking-wider text-slate-200">
            TRUST<span className="text-cyan-400">LAYER</span>
          </span>
        </Link>

        <div className="glass-card rounded-2xl p-8 neon-border">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-slate-100">Create account</h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">Join the autonomous trust network</p>
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
                className={`p-3 rounded-xl border text-left transition-all duration-200 
                  ${form.role === value
                    ? 'border-cyan-500/50 bg-cyan-500/8'
                    : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${form.role === value ? 'text-cyan-400' : 'text-slate-600'}`} />
                <p className={`text-xs font-semibold ${form.role === value ? 'text-cyan-400' : 'text-slate-400'}`}>{label}</p>
                <p className="text-[10px] text-slate-600 font-mono">{desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
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
              <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
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
              <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
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

          <p className="text-center text-xs font-mono text-slate-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign in</Link>
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
