import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Loader2, Star, Trash2, Check, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  author_email?: string;
  rating: number;
  message: string;
  city?: string;
  is_approved: boolean;
  created_at: string;
};

export default function Reviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  async function load() {
    setLoading(true);
    const approved = filter === 'approved' ? true : filter === 'pending' ? false : undefined;
    const { data } = await api.get('/reviews/admin', { params: approved !== undefined ? { approved } : {} });
    setItems(data.items);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function toggleApproval(r: Review) {
    await api.patch(`/reviews/${r.id}`, { is_approved: !r.is_approved });
    toast.success(r.is_approved ? 'Review hidden from public' : 'Review approved');
    load();
  }

  async function remove(r: Review) {
    if (!confirm(`Delete review by ${r.author_name}?`)) return;
    await api.delete(`/reviews/${r.id}`);
    toast.success('Deleted');
    load();
  }

  const pendingCount = items.filter(r => !r.is_approved).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Reviews</h1>
          <p className="text-sm text-slate-500">Customer reviews from product pages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All ({items.length})
          </button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
            Pending ({pendingCount})
          </button>
          <button onClick={() => setFilter('approved')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            Approved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={32} className="mx-auto text-slate-300"/>
          <h3 className="mt-4 font-semibold text-slate-900">No reviews yet</h3>
          <p className="text-sm text-slate-500 mt-1">Customer reviews will appear here after submission.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className={`card p-4 ${!r.is_approved ? 'border-l-4 border-amber-400' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{r.author_name}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
                      ))}
                    </div>
                    {!r.is_approved && <span className="badge bg-amber-100 text-amber-700 text-[10px]">Pending</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {r.city && `${r.city} · `}Product ID: {r.product_id} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-slate-700 mt-2 line-clamp-3">{r.message}</p>
                  {r.author_email && <div className="text-xs text-slate-400 mt-1">Email: {r.author_email}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleApproval(r)} className={`p-2 rounded-lg transition ${r.is_approved ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`} title={r.is_approved ? 'Hide from public' : 'Approve'}>
                    {r.is_approved ? <X size={16}/> : <Check size={16}/>}
                  </button>
                  <button onClick={() => remove(r)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}