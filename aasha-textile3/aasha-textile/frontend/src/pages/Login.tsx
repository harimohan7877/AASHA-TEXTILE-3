import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, email } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  if (email) return <Navigate to="/admin/dashboard" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      nav('/admin/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 70% 80%, white 1px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center font-bold text-xl">A</div>
            <span className="text-lg font-semibold">Aasha Textile</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">Welcome Back</h1>
            <p className="mt-3 text-white/80 max-w-md">Manage your products, videos, categories and site settings — all in one clean, reliable admin panel.</p>
          </div>
          <div className="text-sm text-white/60">© {new Date().getFullYear()} Aasha Textile — All rights reserved.</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 grid place-items-center px-5">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold text-xl">A</div>
            <div>
              <div className="text-lg font-bold text-slate-900">Aasha Textile</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded">
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <><Loader2 className="animate-spin" size={16}/> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400 text-center">Protected admin area. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
