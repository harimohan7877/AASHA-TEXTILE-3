import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Package, Video, Tags, Settings as SettingsIcon, LogOut, Menu, X, MessageSquareQuote, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

const items = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Tags, label: 'Categories' },
  { to: '/admin/videos', icon: Video, label: 'Videos' },
  { to: '/admin/testimonials', icon: MessageSquareQuote, label: 'Testimonials' },
  { to: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function Layout() {
  const { email, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white">
        <Brand />
        <a href="/" target="_blank" rel="noreferrer" className="mx-3 mt-3 mb-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition px-3 py-2 rounded-lg" data-testid="open-public-site">
          <ExternalLink size={12}/> View Public Site
        </a>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <it.icon size={18} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <UserFooter email={email} onLogout={logout} />
      </aside>

      {/* Top bar (mobile) */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100"><Menu size={20}/></button>
        <span className="font-semibold text-slate-900">Aasha Textile</span>
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noreferrer" title="View Public Site" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ExternalLink size={18}/></a>
          <button onClick={logout} className="p-2 -mr-2 rounded-lg hover:bg-slate-100 text-slate-600"><LogOut size={18}/></button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
              <Brand compact />
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {items.map((it) => (
                <button
                  key={it.to}
                  onClick={() => { navigate(it.to); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <it.icon size={18} /> {it.label}
                </button>
              ))}
            </nav>
            <UserFooter email={email} onLogout={logout} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-5 border-b border-slate-200', compact ? 'h-14' : 'h-16')}>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">A</div>
      <div className="leading-tight">
        <div className="font-bold text-slate-900">Aasha Textile</div>
        <div className="text-[11px] text-slate-500">Admin Panel</div>
      </div>
    </div>
  );
}

function UserFooter({ email, onLogout }: { email: string | null; onLogout: () => void }) {
  return (
    <div className="p-3 border-t border-slate-200">
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <div className="w-9 h-9 rounded-full bg-slate-900 text-white grid place-items-center text-sm font-semibold">
          {(email || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">Signed in as</div>
          <div className="text-sm font-medium text-slate-900 truncate">{email}</div>
        </div>
        <button onClick={onLogout} title="Logout" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
