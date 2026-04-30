import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Plus, Pencil, Trash2, X, Loader2, Star, Upload, ImageIcon, Quote, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

type Testimonial = {
  id: string;
  author_name: string;
  city?: string;
  author_role?: string;
  rating: number;
  message: string;
  avatar_url?: string;
  sort_order: number;
  is_published: boolean;
};

const EMPTY: Partial<Testimonial> = {
  author_name: '', city: '', author_role: '', rating: 5, message: '',
  avatar_url: '', sort_order: 0, is_published: true,
};

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/testimonials/admin');
    setItems(data.items);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(t: Testimonial) {
    await api.patch(`/testimonials/${t.id}`, { is_published: !t.is_published });
    toast.success(t.is_published ? 'Hidden from public' : 'Published');
    load();
  }

  async function remove(t: Testimonial) {
    if (!confirm(`Delete testimonial by ${t.author_name}?`)) return;
    await api.delete(`/testimonials/${t.id}`);
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
          <p className="text-sm text-slate-500">{items.length} reviews — shown on homepage</p>
        </div>
        <button onClick={() => setEditing(EMPTY)} className="btn-primary"><Plus size={16}/> Add Testimonial</button>
      </div>

      {loading ? (
        <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Quote size={32} className="mx-auto text-slate-300"/>
          <h3 className="mt-4 font-semibold text-slate-900">No testimonials yet</h3>
          <p className="text-sm text-slate-500 mt-1">Add customer reviews to build trust.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((t) => (
            <div key={t.id} className={`card p-5 ${!t.is_published ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white grid place-items-center flex-shrink-0 overflow-hidden font-semibold">
                  {t.avatar_url ? <img src={resolveImage(t.avatar_url)} className="w-full h-full object-cover" alt=""/> : t.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-slate-900 truncate">{t.author_name}</div>
                    {!t.is_published && <span className="badge bg-amber-100 text-amber-700 text-[10px]">hidden</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{t.author_role}{t.city ? ` · ${t.city}` : ''}</div>
                  <div className="flex items-center mt-1 gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < t.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggle(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title={t.is_published ? 'Hide' : 'Show'}>
                    {t.is_published ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                  <button onClick={() => setEditing(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={14}/></button>
                  <button onClick={() => remove(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14}/></button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed line-clamp-4">"{t.message}"</p>
              <div className="text-[10px] text-slate-400 mt-2">sort: {t.sort_order}</div>
            </div>
          ))}
        </div>
      )}

      {editing && <TestimonialModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}/>}
    </div>
  );
}

function TestimonialModal({ initial, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isEdit = !!initial?.id;

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, avatar_url: data.url });
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, rating: parseInt(form.rating) || 5, sort_order: parseInt(form.sort_order || 0) };
      if (isEdit) {
        await api.patch(`/testimonials/${initial.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/testimonials', payload);
        toast.success('Added');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 overflow-auto" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/60"/>
      <div className="relative bg-white rounded-2xl shadow-pop max-w-lg w-full my-8" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 h-14 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Avatar (optional)</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden grid place-items-center">
                {form.avatar_url ? <img src={resolveImage(form.avatar_url)} className="w-full h-full object-cover" alt=""/> : <ImageIcon size={20} className="text-slate-300"/>}
              </div>
              <label className="btn-secondary cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}/>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input required className="input" value={form.author_name || ''} onChange={(e) => setForm({ ...form, author_name: e.target.value })}/>
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city || ''} placeholder="Jaipur, Rajasthan" onChange={(e) => setForm({ ...form, city: e.target.value })}/>
            </div>
            <div className="col-span-2">
              <label className="label">Role</label>
              <input className="input" value={form.author_role || ''} placeholder="Retail Shop Owner" onChange={(e) => setForm({ ...form, author_role: e.target.value })}/>
            </div>
            <div>
              <label className="label">Rating</label>
              <select className="input" value={form.rating || 5} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" className="input" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}/>
            </div>
          </div>
          <div>
            <label className="label">Message / Review</label>
            <textarea required className="input min-h-[110px]" value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })}/>
          </div>
          <div className="flex items-center gap-2">
            <input id="pub" type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })}/>
            <label htmlFor="pub" className="text-sm font-medium text-slate-700">Publish on website</label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button disabled={saving} className="btn-primary">{saving ? <><Loader2 className="animate-spin" size={14}/> Saving...</> : (isEdit ? 'Update' : 'Add')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
