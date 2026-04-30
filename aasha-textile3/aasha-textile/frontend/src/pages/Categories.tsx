import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Plus, Pencil, Trash2, X, Loader2, Tags, Upload, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

type Category = {
  id: string | null; name: string; slug: string; description?: string; image_url?: string;
  sort_order: number; product_count?: number; virtual?: boolean;
};

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/categories');
    setItems(data.items);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(c: Category) {
    if (!c.id) return;
    if (!confirm(`Delete category “${c.name}”? Products in this category will be moved to “Other”.`)) return;
    await api.delete(`/categories/${c.id}`);
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">{items.length} categories — dynamically scanned from your catalog</p>
        </div>
        <button onClick={() => setEditing({ name: '', description: '', sort_order: 0 })} className="btn-primary"><Plus size={16}/> Add Category</button>
      </div>

      {loading ? <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div> :
       items.length === 0 ? (
         <div className="card p-12 text-center">
           <Tags size={32} className="mx-auto text-slate-300"/>
           <h3 className="mt-4 font-semibold text-slate-900">No categories yet</h3>
         </div>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.name} className="card p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {c.image_url ? <img src={resolveImage(c.image_url)} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full grid place-items-center text-slate-300"><Tags size={18}/></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  {c.name}
                  {c.virtual && <span className="badge bg-amber-100 text-amber-700">auto</span>}
                </div>
                <div className="text-xs text-slate-500 truncate">{c.description || c.slug}</div>
                <div className="text-xs text-slate-600 mt-1"><span className="font-medium">{c.product_count || 0}</span> products</div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(c)} className="btn-secondary !py-1 !px-2 text-xs"><Pencil size={12}/></button>
                {c.id && <button onClick={() => remove(c)} className="btn-ghost !py-1 !px-2 text-xs !text-red-600 hover:!bg-red-50"><Trash2 size={12}/></button>}
              </div>
            </div>
          ))}
        </div>
       )}

      {editing && <CategoryModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function CategoryModal({ initial, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isEdit = !!initial?.id && !initial?.virtual;

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, image_url: data.url });
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order || 0) };
      if (isEdit) {
        await api.patch(`/categories/${initial.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/60"/>
      <div className="relative bg-white rounded-2xl shadow-pop max-w-lg w-full" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 h-14 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Image</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden grid place-items-center">
                {form.image_url ? <img src={resolveImage(form.image_url)} className="w-full h-full object-cover" alt=""/> : <ImageIcon size={22} className="text-slate-300"/>}
              </div>
              <label className="btn-secondary cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" className="input" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}/>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button disabled={saving} className="btn-primary">{saving ? <><Loader2 className="animate-spin" size={14}/> Saving...</> : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
