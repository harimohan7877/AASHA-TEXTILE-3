import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Package, Star, AlertCircle, Video as VideoIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

type Stats = {
  total_products: number;
  featured: number;
  out_of_stock: number;
  in_stock: number;
  total_videos: number;
  by_category: { name: string; count: number }[];
  recent_products: any[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="py-20 grid place-items-center"><div className="animate-spin h-7 w-7 border-3 border-brand-500 border-t-transparent rounded-full"/></div>;

  const cards = [
    { label: 'Total Products', value: stats.total_products, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Featured', value: stats.featured, icon: Star, color: 'bg-amber-50 text-amber-600' },
    { label: 'In Stock', value: stats.in_stock, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Out of Stock', value: stats.out_of_stock, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Videos', value: stats.total_videos, icon: VideoIcon, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your store — Aasha Textile</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} grid place-items-center mb-3`}><c.icon size={18} /></div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Products by Category</h3>
              <p className="text-xs text-slate-500">Auto-derived from your product catalog</p>
            </div>
            <Link to="/categories" className="text-xs text-brand-600 hover:underline">Manage</Link>
          </div>
          {stats.by_category.length === 0 ? (
            <div className="text-sm text-slate-500 py-10 text-center">No categories yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_category} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#64748b" />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Products</h3>
            <Link to="/products" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {stats.recent_products.length === 0 && <div className="text-sm text-slate-500 py-6 text-center">No products yet.</div>}
            {stats.recent_products.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {p.image_url ? <img src={resolveImage(p.image_url)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full grid place-items-center text-slate-400"><Package size={14}/></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">{p.category} • {p.rate || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
