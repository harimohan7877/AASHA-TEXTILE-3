import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Pencil, Trash2, X, Loader2, Video as VideoIcon, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

type Video = { id: string; video_id: string; title: string; thumbnail_url?: string; sort_order: number };

function extractVideoId(input: string): string {
  // Accept full URLs or IDs
  const m1 = input.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (m1) return m1[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return input.trim();
}

export default function Videos() {
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Video> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/videos');
    setItems(data.items);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(v: Video) {
    if (!confirm(`Delete “${v.title}”?`)) return;
    await api.delete(`/videos/${v.id}`);
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Videos</h1>
          <p className="text-sm text-slate-500">{items.length} YouTube videos</p>
        </div>
        <button onClick={() => setEditing({ title: '', video_id: '', sort_order: 0 })} className="btn-primary"><Plus size={16}/> Add Video</button>
      </div>

      {loading ? <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div> :
       items.length === 0 ? (
         <div className="card p-12 text-center">
           <VideoIcon size={32} className="mx-auto text-slate-300"/>
           <h3 className="mt-4 font-semibold text-slate-900">No videos yet</h3>
           <p className="text-sm text-slate-500 mt-1">Add your first YouTube video.</p>
         </div>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => (
            <div key={v.id} className="card overflow-hidden group">
              <div className="aspect-video bg-slate-900 relative">
                {v.thumbnail_url ? <img src={v.thumbnail_url} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full grid place-items-center text-slate-500"><VideoIcon size={32}/></div>}
                <a target="_blank" rel="noreferrer" href={`https://www.youtube.com/watch?v=${v.video_id}`} className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                  <div className="w-12 h-12 rounded-full bg-white/90 grid place-items-center"><ExternalLink size={18} className="text-slate-900"/></div>
                </a>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-slate-900 line-clamp-2">{v.title}</div>
                <div className="text-xs text-slate-500 mt-1">ID: {v.video_id} • sort: {v.sort_order}</div>
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => setEditing(v)} className="flex-1 btn-secondary !py-1.5 text-xs"><Pencil size={12}/> Edit</button>
                  <button onClick={() => remove(v)} className="btn-ghost !py-1.5 !px-2 text-xs !text-red-600 hover:!bg-red-50"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
       )}

      {editing && <VideoModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function VideoModal({ initial, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const vid = extractVideoId(form.video_id || '');
    if (!vid || !form.title) { toast.error('Title and Video ID are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, video_id: vid, sort_order: parseInt(form.sort_order || 0) };
      if (isEdit) {
        await api.patch(`/videos/${initial.id}`, payload);
        toast.success('Video updated');
      } else {
        await api.post('/videos', payload);
        toast.success('Video added');
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
          <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Video' : 'Add New Video'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })}/>
          </div>
          <div>
            <label className="label">YouTube Video ID or URL</label>
            <input required className="input" placeholder="dQw4w9WgXcQ or https://youtu.be/..." value={form.video_id || ''} onChange={(e) => setForm({ ...form, video_id: e.target.value })}/>
            <p className="text-xs text-slate-500 mt-1">Thumbnail will be auto-filled if blank.</p>
          </div>
          <div>
            <label className="label">Thumbnail URL (optional)</label>
            <input className="input" value={form.thumbnail_url || ''} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}/>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" className="input" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}/>
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
