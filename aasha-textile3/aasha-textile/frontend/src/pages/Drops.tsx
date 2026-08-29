import React, { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import {
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Clock,
  Package,
  Upload,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Image as ImageIcon,
  Bot,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export type DropProduct = {
  id: string;
  imageUrl: string;
  title: string;
  price: string;
  details: string;
  sizeOptions?: string[];
  inStock: boolean;
};

export type Drop = {
  id: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  addedAt: string;
  expiresAt: string;
  products: DropProduct[];
  status: 'active' | 'deleted_manually' | 'expired';
};

function formatTimeRemaining(expiresAtStr: string): { label: string; urgent: boolean } {
  try {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return { label: 'Expired', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 1) {
      return { label: `${days} days left`, urgent: false };
    }
    if (days === 1) {
      return { label: `1 day, ${hours} hrs left`, urgent: false };
    }
    return { label: `${hours} hours left (Auto-expires soon)`, urgent: true };
  } catch {
    return { label: '5 days active', urgent: false };
  }
}

function extractYouTubeId(urlOrId: string): string {
  const text = (urlOrId || '').trim();
  if (text.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  const match = text.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/watch\?v=|\&v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : text;
}

export default function Drops() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Drop Modal state
  const [createDropOpen, setCreateDropOpen] = useState(false);
  const [creatingDrop, setCreatingDrop] = useState(false);
  const [newDropUrl, setNewDropUrl] = useState('');
  const [newDropTitle, setNewDropTitle] = useState('');

  // AI Drop Modal (Mobile / Web) state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiYtUrl, setAiYtUrl] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiJsonText, setAiJsonText] = useState('');
  const [aiProducts, setAiProducts] = useState<Array<DropProduct & { time?: string }>>([]);
  const [publishingAiDrop, setPublishingAiDrop] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Selected Drop for adding/managing products
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);

  // Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DropProduct | null>(null);
  const [productForm, setProductForm] = useState<Partial<DropProduct>>({
    title: '',
    price: '',
    details: '',
    imageUrl: '',
    inStock: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  async function loadDrops() {
    setLoading(true);
    try {
      const { data } = await api.get('/drops');
      setDrops(data.items || []);
      if (activeDrop) {
        const found = (data.items || []).find((d: Drop) => d.id === activeDrop.id);
        if (found) setActiveDrop(found);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load Drops');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrops();
  }, []);

  // -------------------------------------------------------------
  // MANUAL DROP CREATION
  // -------------------------------------------------------------
  async function handleCreateDrop(e: React.FormEvent) {
    e.preventDefault();
    if (!newDropUrl.trim()) {
      toast.error('Please enter a YouTube video URL or ID');
      return;
    }

    setCreatingDrop(true);
    try {
      const { data } = await api.post('/drops', {
        youtubeUrl: newDropUrl.trim(),
        title: newDropTitle.trim() || undefined,
      });
      toast.success('New 5-Day Video Drop created!');
      setNewDropUrl('');
      setNewDropTitle('');
      setCreateDropOpen(false);
      await loadDrops();
      setActiveDrop(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create Drop');
    } finally {
      setCreatingDrop(false);
    }
  }

  // -------------------------------------------------------------
  // AI DROP PARSER (Mobile & Web)
  // -------------------------------------------------------------
  function parseGeminiJson() {
    if (!aiJsonText.trim()) {
      toast.error('Please paste the Gemini AI JSON text');
      return;
    }

    const vid = extractYouTubeId(aiYtUrl);
    let raw = aiJsonText.trim();

    // Auto extract [...]
    const match = raw.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      raw = match[0];
    } else {
      raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Input must be a list of products');
      }

      const items: Array<DropProduct & { time?: string }> = parsed.map((item: any, idx: number) => {
        const title = item.name || item.title || `Product #${idx + 1}`;
        const price = item.rate || item.price || '';
        const details = item.details || item.info || '';
        const time = item.time || item.timestamp || '';
        const fallbackImg = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';

        return {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          title,
          price,
          details,
          time,
          imageUrl: item.imageUrl || fallbackImg,
          inStock: true,
        };
      });

      setAiProducts(items);
      toast.success(`Successfully parsed ${items.length} products!`);
    } catch (err: any) {
      toast.error('Invalid JSON format. Make sure it contains [ { ... } ]');
    }
  }

  async function handlePublishAiDrop() {
    const vid = extractYouTubeId(aiYtUrl);
    if (!vid) {
      toast.error('Please enter a valid YouTube Video Link or ID');
      return;
    }
    if (aiProducts.length === 0) {
      toast.error('Please parse at least 1 product from Gemini JSON');
      return;
    }

    setPublishingAiDrop(true);
    const toastId = toast.loading('Publishing 5-Day Video Drop...');
    try {
      // 1. Create or get drop
      let dropId = vid;
      try {
        const { data: created } = await api.post('/drops', {
          youtubeVideoId: vid,
          youtubeUrl: `https://www.youtube.com/watch?v=${vid}`,
          title: aiTitle.trim() || 'Aasha Textile Fabric Drop',
          thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        });
        dropId = created.id || vid;
      } catch (e: any) {
        // Drop might already exist, update it
        dropId = vid;
      }

      // 2. Attach products
      const cleanProducts: DropProduct[] = aiProducts.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        details: p.details + (p.time ? ` (Time: ${p.time})` : ''),
        imageUrl: p.imageUrl,
        inStock: p.inStock,
      }));

      await api.patch(`/drops/${dropId}`, {
        products: cleanProducts,
        title: aiTitle.trim() || undefined,
        status: 'active',
      });

      toast.success('🎉 Video Drop published successfully!', { id: toastId });
      setAiModalOpen(false);
      setAiYtUrl('');
      setAiTitle('');
      setAiJsonText('');
      setAiProducts([]);
      await loadDrops();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to publish Drop', { id: toastId });
    } finally {
      setPublishingAiDrop(false);
    }
  }

  function handleCopyGeminiPrompt() {
    const promptText = `Is video ko dekh kar har alag-alag kapde (fabric) ke best clear frame ka timestamp (jaise 01:25), kapde ka naam, rate (price), aur panna/cut mujhe neeche diye format me JSON list me do:\n[\n  {"time": "01:24", "name": "Heavy Rayon Print", "rate": "₹65/m", "details": "44 Panna, Cut 10m"},\n  {"time": "03:45", "name": "Cotton Slub Plain", "rate": "₹52/m", "details": "58 Panna, Cut 20m"}\n]`;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    toast.success('Prompt copied! Paste it in Gemini AI');
    setTimeout(() => setCopiedPrompt(false), 3000);
  }

  // -------------------------------------------------------------
  // DELETE DROP
  // -------------------------------------------------------------
  async function handleDeleteDrop(dropId: string) {
    if (!confirm('Are you sure you want to delete this Drop early? All its attached photos will also be cleaned up immediately.')) {
      return;
    }

    try {
      await api.delete(`/drops/${dropId}`);
      toast.success('Drop deleted early');
      if (activeDrop?.id === dropId) setActiveDrop(null);
      await loadDrops();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete Drop');
    }
  }

  // -------------------------------------------------------------
  // PRODUCT MANAGEMENT INSIDE DROP
  // -------------------------------------------------------------
  function openAddProduct(drop: Drop) {
    setActiveDrop(drop);
    setEditingProduct(null);
    setProductForm({
      title: '',
      price: '',
      details: '',
      imageUrl: '',
      inStock: true,
    });
    setProductModalOpen(true);
  }

  function openEditProduct(drop: Drop, product: DropProduct) {
    setActiveDrop(drop);
    setEditingProduct(product);
    setProductForm({ ...product });
    setProductModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const toastId = toast.loading('Uploading image with 5-day auto expiry...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/images/upload?is_drop_image=true&expires_in_days=5', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('Image uploaded!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Image upload failed', { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDrop) return;
    if (!productForm.title?.trim() || !productForm.price?.trim()) {
      toast.error('Product title and price are required');
      return;
    }

    setSavingProduct(true);
    try {
      const currentProducts = activeDrop.products || [];
      let updatedProducts: DropProduct[] = [];

      if (editingProduct) {
        // Edit
        updatedProducts = currentProducts.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                title: productForm.title!.trim(),
                price: productForm.price!.trim(),
                details: productForm.details || '',
                imageUrl: productForm.imageUrl || '',
                inStock: productForm.inStock !== false,
              }
            : p
        );
      } else {
        // Add new
        const newProd: DropProduct = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          title: productForm.title!.trim(),
          price: productForm.price!.trim(),
          details: productForm.details || '',
          imageUrl: productForm.imageUrl || '',
          inStock: productForm.inStock !== false,
        };
        updatedProducts = [...currentProducts, newProd];
      }

      await api.patch(`/drops/${activeDrop.id}`, { products: updatedProducts });
      toast.success(editingProduct ? 'Product updated' : 'Product added to Drop!');
      setProductModalOpen(false);
      await loadDrops();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(drop: Drop, productId: string) {
    if (!confirm('Remove this product from the Drop?')) return;

    try {
      const updatedProducts = (drop.products || []).filter((p) => p.id !== productId);
      await api.patch(`/drops/${drop.id}`, { products: updatedProducts });
      toast.success('Product removed');
      await loadDrops();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to remove product');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Sparkles size={22} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Video Drops</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              5-Day Auto-TTL Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage YouTube product showcase drops. Products displayed here auto-expire after 5 days, or can be deleted early.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {/* Mobile / Web AI Drop Creator */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-sm transition hover:shadow-md"
          >
            <Bot size={18} />
            <span>✨ Create with AI (Mobile)</span>
          </button>

          {/* Standard Manual Drop Creator */}
          <button
            onClick={() => setCreateDropOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Drop
          </button>
        </div>
      </div>

      {/* Drops Grid / List */}
      {loading ? (
        <div className="py-20 grid place-items-center">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : drops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full grid place-items-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Drops</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Create a video drop using your mobile phone with Gemini AI or paste a YouTube link manually.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 flex items-center gap-2 shadow-sm"
            >
              <Bot size={16} /> Create with Gemini AI
            </button>
            <button
              onClick={() => setCreateDropOpen(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Manual Drop
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {drops.map((drop) => {
            const timeInfo = formatTimeRemaining(drop.expiresAt);
            const isSelected = activeDrop?.id === drop.id;

            return (
              <div
                key={drop.id}
                className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                  isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'
                }`}
              >
                {/* Drop Header Card */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start gap-4">
                    {/* Video Thumbnail */}
                    <div className="relative w-28 sm:w-36 aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group">
                      <img
                        src={drop.thumbnailUrl || `https://img.youtube.com/vi/${drop.youtubeVideoId}/hqdefault.jpg`}
                        alt={drop.title}
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={drop.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <Play size={24} fill="currentColor" />
                      </a>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            timeInfo.urgent
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Clock size={12} />
                          {timeInfo.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          Expires: {new Date(drop.expiresAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                        {drop.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{drop.products?.length || 0} Attached Products</span>
                        <span>•</span>
                        <a
                          href={drop.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1"
                        >
                          Watch Video <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => openAddProduct(drop)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Product
                    </button>
                    <button
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete Drop Early"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Attached Products Section */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Attached Products ({drop.products?.length || 0})
                    </h4>
                    <span className="text-xs text-slate-400">
                      These appear on the public Video Drops page with 1-click WhatsApp order.
                    </span>
                  </div>

                  {(!drop.products || drop.products.length === 0) ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
                      <Package className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-xs text-slate-500 mb-3">
                        No products attached yet. Add sample photos and wholesale rates shown in this video.
                      </p>
                      <button
                        onClick={() => openAddProduct(drop)}
                        className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                      >
                        <Plus size={12} /> Add First Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {drop.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition flex flex-col justify-between"
                        >
                          <div>
                            {/* Product Image */}
                            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3 relative group">
                              {prod.imageUrl ? (
                                <img
                                  src={resolveImage(prod.imageUrl)}
                                  alt={prod.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-slate-400">
                                  <ImageIcon size={24} />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    prod.inStock !== false
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-red-500 text-white'
                                  }`}
                                >
                                  {prod.inStock !== false ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </div>

                            <h5 className="font-bold text-slate-900 text-sm truncate mb-0.5">
                              {prod.title}
                            </h5>
                            <div className="text-xs font-bold text-brand-600 mb-1">
                              {prod.price}
                            </div>
                            {prod.details && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                                {prod.details}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-2">
                            <button
                              onClick={() => openEditProduct(drop, prod)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(drop, prod.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🤖 MOBILE / WEB AI DROP CREATOR MODAL */}
      {/* ============================================================ */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-sm">
                  <Bot size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Create Video Drop with Gemini AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Works directly on Mobile & Web with 5-Day Auto Expiry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Copy Gemini Prompt Helper */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-600" />
                    Gemini AI Prompt Helper
                  </div>
                  <p className="text-[11px] text-purple-700 mt-0.5 truncate">
                    Copy prompt ➡️ Paste in YouTube Gemini ➡️ Paste output below
                  </p>
                </div>
                <button
                  onClick={handleCopyGeminiPrompt}
                  className="btn-secondary bg-white text-xs py-1 px-3 flex items-center gap-1.5 border-purple-200 flex-shrink-0 text-purple-700 hover:bg-purple-100"
                >
                  {copiedPrompt ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>

              {/* YouTube Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. YouTube Video Link or ID *
                </label>
                <input
                  type="text"
                  placeholder="https://youtu.be/U1FKChSnytQ or U1FKChSnytQ"
                  value={aiYtUrl}
                  onChange={(e) => setAiYtUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Drop Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Collection Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rayon Capsule Fabric Latest Collection"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Gemini JSON input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    3. Paste Gemini AI JSON Output *
                  </label>
                  <button
                    type="button"
                    onClick={parseGeminiJson}
                    className="text-xs font-bold text-purple-600 hover:underline"
                  >
                    Parse JSON
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder={`Paste raw Gemini output here, e.g.:\n[\n  {"time": "02:22", "name": "Rayon Capsule with Zari", "rate": "₹330/Kg", "details": "All-over Print"}\n]`}
                  value={aiJsonText}
                  onChange={(e) => setAiJsonText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Parse Button */}
              {aiProducts.length === 0 && (
                <button
                  type="button"
                  onClick={parseGeminiJson}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm bg-purple-100 text-purple-800 hover:bg-purple-200 transition flex items-center justify-center gap-1.5"
                >
                  <Bot size={16} /> Parse Products from JSON
                </button>
              )}

              {/* Parsed Products Preview List */}
              {aiProducts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Parsed Products ({aiProducts.length})
                    </span>
                    <button
                      onClick={() => setAiProducts([])}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear / Re-parse
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {aiProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative group">
                            <img
                              src={resolveImage(p.imageUrl)}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-black/50 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  try {
                                    const { data } = await api.post('/images/upload?is_drop_image=true&expires_in_days=5', fd);
                                    setAiProducts((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, imageUrl: data.url } : item))
                                    );
                                    toast.success('Photo updated!');
                                  } catch {
                                    toast.error('Upload failed');
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {p.title}
                            </div>
                            <div className="text-[11px] font-semibold text-brand-600 truncate">
                              {p.price} {p.time && `• Time: ${p.time}`}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {p.details}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setAiProducts((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publish CTA */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={publishingAiDrop || aiProducts.length === 0}
                  onClick={handlePublishAiDrop}
                  className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-none text-sm py-2 px-5 flex items-center gap-2 font-semibold shadow-sm"
                >
                  {publishingAiDrop ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Publishing Drop...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Publish Drop (5-Day Live)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MANUAL CREATE DROP MODAL */}
      {/* ============================================================ */}
      {createDropOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                Create 5-Day Video Drop
              </h3>
              <button
                onClick={() => setCreateDropOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDrop} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YouTube Video URL or Video ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or ID"
                  value={newDropUrl}
                  onChange={(e) => setNewDropUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports full YouTube URLs, youtu.be short links, or 11-char Video IDs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drop Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Surat Wholesale Cotton Saree New Arrival"
                  value={newDropTitle}
                  onChange={(e) => setNewDropTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Clock className="text-amber-700 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="font-semibold">Auto-Expires in 5 Days</div>
                  This drop will automatically disappear from the public site after 5 days, or you can delete it early anytime.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateDropOpen(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDrop}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                >
                  {creatingDrop && <Loader2 className="animate-spin" size={16} />}
                  Create Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRODUCT MODAL (Add / Edit product inside drop) */}
      {/* ============================================================ */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Package className="text-brand-600" size={20} />
                {editingProduct ? 'Edit Drop Product' : 'Add Product to Drop'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Sample Photo (5-Day TTL Auto-Cleanup)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 grid place-items-center">
                    {productForm.imageUrl ? (
                      <img
                        src={resolveImage(productForm.imageUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="btn-secondary cursor-pointer inline-flex items-center gap-1.5 text-xs py-1.5 px-3">
                      <Upload size={14} />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={productForm.imageUrl || ''}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Bandhani Suit Piece"
                  value={productForm.title || ''}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price / Wholesale Rate *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹450 / Piece or ₹85 / Meter"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details / Specs
                </label>
                <textarea
                  rows={2}
                  placeholder="Cut: 2.5m, Width: 44-panna, Pure cotton fast colors..."
                  value={productForm.details || ''}
                  onChange={(e) => setProductForm({ ...productForm, details: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Stock toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dropInStock"
                  checked={productForm.inStock !== false}
                  onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="dropInStock" className="text-xs font-medium text-slate-700 cursor-pointer">
                  In Stock (Available for WhatsApp orders)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                >
                  {savingProduct && <Loader2 className="animate-spin" size={16} />}
                  {editingProduct ? 'Update Product' : 'Add to Drop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
