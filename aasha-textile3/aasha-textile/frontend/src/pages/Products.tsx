import { useEffect, useMemo, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Plus, Search, Pencil, Trash2, Star, Package, X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Product = {
  id: string; name: string; name_en?: string; variety?: string; rate?: string; cut?: string; panna?: string;
  info?: string; image_url?: string; category: string; stock_status: string; is_featured: boolean; sort_order: number;
};

const EMPTY: Partial<Product> = {
  name: '', name_en: '', variety: '', rate: '', cut: '', panna: '', info: '',
  image_url: '', category: 'Other', stock_status: 'available', is_featured: false, sort_order: 0,
};

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/products', { params: { q: q || undefined, category: cat || undefined } });
    setItems(data.items);
    setLoading(false);
  }
  async function loadCats() {
    const { data } = await api.get('/categories');
    setCategories(data.items);
  }
  useEffect(() => { loadCats(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, cat]);

  async function remove(p: Product) {
    if (!confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    await api.delete(`/products/${p.id}`);
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{items.length} items {cat && `in ${cat}`}</p>
        </div>
        <button onClick={() => setEditing(EMPTY)} className="btn-primary"><Plus size={16}/> Add Product</button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Search name, variety, info..." value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <select className="input max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={32} className="mx-auto text-slate-300"/>
          <h3 className="mt-4 font-semibold text-slate-900">No products found</h3>
          <p className="text-sm text-slate-500 mt-1">Try clearing filters, or add a new product.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((p) => (
            <div key={p.id} className="card overflow-hidden hover:shadow-pop transition-shadow group">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={resolveImage(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                ) : <div className="w-full h-full grid place-items-center text-slate-300"><ImageIcon size={32}/></div>}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {p.is_featured && <span className="badge bg-amber-100 text-amber-800"><Star size={10} fill="currentColor"/> Featured</span>}
                  {p.stock_status === 'out_of_stock' && <span className="badge bg-red-100 text-red-700">Out of stock</span>}
                </div>
              </div>
              <div className="p-3">
                <div className="font-semibold text-slate-900 text-sm truncate">{p.name}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{p.name_en || '—'}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="badge bg-slate-100 text-slate-700">{p.category}</span>
                  <span className="text-sm font-semibold text-brand-700">{p.rate || ''}</span>
                </div>
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => setEditing(p)} className="flex-1 btn-secondary !py-1.5 !px-2 text-xs"><Pencil size={12}/> Edit</button>
                  <button onClick={() => remove(p)} className="btn-ghost !py-1.5 !px-2 text-xs !text-red-600 hover:!bg-red-50"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductFormModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); loadCats(); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ initial, categories, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isEdit = !!initial?.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.sort_order === '' || payload.sort_order === null) payload.sort_order = 0;
      else payload.sort_order = parseInt(payload.sort_order);
      if (isEdit) {
        await api.patch(`/products/${initial.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, image_url: data.url });
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 overflow-auto" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/60"/>
      <div className="relative bg-white rounded-2xl shadow-pop max-w-3xl w-full my-8" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 h-14 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-6 grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label">Image</label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 rounded-lg bg-slate-100 overflow-hidden grid place-items-center">
                {form.image_url ? (
                  <img src={resolveImage(form.image_url)} className="w-full h-full object-cover" alt=""/>
                ) : <ImageIcon size={28} className="text-slate-300"/>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="btn-secondary cursor-pointer">
                  {uploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
                <input className="input" placeholder="Or paste image URL..." value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })}/>
                <p className="text-xs text-slate-500">Auto-resized to 1600px, JPEG-optimized. Max 10 MB.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Name (Hindi / Display)</label>
            <input required className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
          </div>
          <div>
            <label className="label">Name (English)</label>
            <input className="input" value={form.name_en || ''} onChange={(e) => setForm({ ...form, name_en: e.target.value })}/>
          </div>
          <div>
            <label className="label">Category</label>
            <input list="cat-list" className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}/>
            <datalist id="cat-list">
              {categories.map((c: any) => <option key={c.name} value={c.name}/>)}
            </datalist>
          </div>
          <div>
            <label className="label">Rate / Price</label>
            <input className="input" placeholder="e.g. ₹350/KG" value={form.rate || ''} onChange={(e) => setForm({ ...form, rate: e.target.value })}/>
          </div>
          <div>
            <label className="label">Variety</label>
            <input className="input" placeholder="Printed / Plain..." value={form.variety || ''} onChange={(e) => setForm({ ...form, variety: e.target.value })}/>
          </div>
          <div>
            <label className="label">Cut</label>
            <input className="input" placeholder="Standard / ..." value={form.cut || ''} onChange={(e) => setForm({ ...form, cut: e.target.value })}/>
          </div>
          <div>
            <label className="label">Panna (width)</label>
            <input className="input" placeholder='60"' value={form.panna || ''} onChange={(e) => setForm({ ...form, panna: e.target.value })}/>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" className="input" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}/>
          </div>
          <div>
            <label className="label">Stock Status</label>
            <select className="input" value={form.stock_status || 'available'} onChange={(e) => setForm({ ...form, stock_status: e.target.value })}>
              <option value="available">Available</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="feat" type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}/>
            <label htmlFor="feat" className="text-sm font-medium text-slate-700">Featured product</label>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description / Info</label>
            <textarea className="input min-h-[90px]" value={form.info || ''} onChange={(e) => setForm({ ...form, info: e.target.value })}/>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button disabled={saving} className="btn-primary">{saving ? <><Loader2 className="animate-spin" size={14}/> Saving...</> : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
