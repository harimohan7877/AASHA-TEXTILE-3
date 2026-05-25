import { useEffect, useMemo, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Plus, Search, Pencil, Trash2, Star, Package, X, Upload, ImageIcon, Loader2, Cpu } from 'lucide-react';
import AICatalogScannerModal from '../components/AICatalogScannerModal';
import toast from 'react-hot-toast';
import { getImageUrl, callAI, resolveScannedCategory } from '../lib/ai';

type Product = {
  id: string; name: string; name_en?: string; variety?: string; rate?: string; cut?: string; panna?: string;
  info?: string; image_url?: string; images?: string[]; category: string; stock_status: string; is_featured: boolean; sort_order: number;
};

const EMPTY: Partial<Product> = {
  name: '', name_en: '', variety: '', rate: '', cut: '', panna: '', info: '',
  image_url: '', images: [], category: 'Other', stock_status: 'available', is_featured: false, sort_order: 0,
};

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

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
        <div className="flex gap-2">
          <button onClick={() => setScannerOpen(true)} className="btn-secondary flex items-center gap-1.5"><Cpu size={16}/> AI Catalog Scanner</button>
          <button onClick={() => setEditing(EMPTY)} className="btn-primary"><Plus size={16}/> Add Product</button>
        </div>
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

      {scannerOpen && (
        <AICatalogScannerModal
          categories={categories}
          onClose={() => setScannerOpen(false)}
          onSaved={() => {
            setScannerOpen(false);
            load();
            loadCats();
          }}
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
  const [autofilling, setAutofilling] = useState(false);

  async function handleAIAutofill() {
    const imageUrl = form.images?.[0] || form.image_url;
    if (!imageUrl) {
      toast.error('Pehle image upload karein ya image URL add karein!');
      return;
    }
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    let key = localStorage.getItem('ai_api_key') || '';
    if (!key) {
      const inputKey = prompt('Please enter your Gemini/AI API key to use autofill:');
      if (!inputKey) return;
      key = inputKey;
      localStorage.setItem('ai_api_key', key);
    }
    setAutofilling(true);
    const toastId = toast.loading('AI scanning image and autofilling form...');
    try {
      const resolvedUrl = getImageUrl(imageUrl);
      const result = await callAI(provider, key, [resolvedUrl], categories.map((c: any) => c.name));
      if (result && result[0]) {
        const item = result[0];
        setForm((prev: any) => ({
          ...prev,
          name: item.name || prev.name,
          name_en: item.name || prev.name_en,
          rate: item.price || prev.rate,
          info: item.desc || prev.info,
          variety: item.variety || prev.variety,
          category: resolveScannedCategory(item.category, categories)
        }));
        toast.success('Form details auto-filled successfully!', { id: toastId });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e: any) {
      toast.error(e.message || 'AI Autofill failed', { id: toastId });
    } finally {
      setAutofilling(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
    const payload = { ...form };
      // images array se image_url set karo
      if (payload.images && payload.images.length > 0) payload.image_url = payload.images[0];
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

  async function uploadMultiple(files: FileList) {
    if (files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} images...`);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url;
      });
      const urls = await Promise.all(uploadPromises);
      const currentImages = form.images || (form.image_url ? [form.image_url] : []);
      const newImages = [...currentImages, ...urls];
      setForm({ ...form, images: newImages, image_url: newImages[0] });
      toast.success(`${files.length} images uploaded successfully`, { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'One or more uploads failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl(url: string) {
    if (!url.trim()) return;
    const currentImages = form.images || (form.image_url ? [form.image_url] : []);
    const newImages = [...currentImages, getImageUrl(url)];
    setForm({ ...form, images: newImages, image_url: newImages[0] });
  }

  function removeImage(idx: number) {
    const newImages = (form.images || []).filter((_: any, i: number) => i !== idx);
    setForm({ ...form, images: newImages, image_url: newImages[0] || '' });
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
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0">Images (Multiple — pehli = main image)</label>
              <button
                type="button"
                onClick={handleAIAutofill}
                disabled={autofilling}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold transition px-2.5 py-1 rounded bg-brand-50 border border-brand-200"
              >
                {autofilling ? <Loader2 className="animate-spin" size={12}/> : <Cpu size={12}/>}
                Ask AI to Autofill Info
              </button>
            </div>
            {/* Image thumbnails */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.images && form.images.length > 0 ? form.images : form.image_url ? [form.image_url] : []).map((img: string, idx: number) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200 group">
                  <img src={resolveImage(img)} alt="" className="w-full h-full object-cover"/>
                  {idx === 0 && <span className="absolute top-0 left-0 bg-brand-600 text-white text-[9px] px-1 py-0.5 font-bold">MAIN</span>}
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition text-xs font-bold">
                    ✕ Remove
                  </button>
                </div>
              ))}
              {/* Upload button */}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 grid place-items-center cursor-pointer hover:border-brand-400 transition bg-slate-50">
                {uploading ? <Loader2 className="animate-spin text-brand-600" size={18}/> : <Upload size={18} className="text-slate-400"/>}
                <span className="text-[10px] text-slate-400 mt-1">Upload</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadMultiple(e.target.files)}/>
              </label>
            </div>
            {/* URL input */}
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Ya ImgBB URL paste karo..." id="img-url-input"/>
              <button type="button" className="btn-secondary" onClick={() => {
                const inp = document.getElementById('img-url-input') as HTMLInputElement;
                if (inp?.value) { addImageUrl(inp.value); inp.value = ''; }
              }}>Add URL</button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Pehli image = main display. Hover karo remove karne ke liye.</p>
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
            <select
              required
              className="input bg-white"
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="" disabled>Select Category</option>
              {categories.map((c: any) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
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
