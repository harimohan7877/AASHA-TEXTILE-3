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

export default function Drops() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createDropOpen, setCreateDropOpen] = useState(false);
  const [creatingDrop, setCreatingDrop] = useState(false);
  const [newDropUrl, setNewDropUrl] = useState('');
  const [newDropTitle, setNewDropTitle] = useState('');

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
      toast.success('Video Drop created! (Auto-expires in 5 days)');
      setCreateDropOpen(false);
      setNewDropUrl('');
      setNewDropTitle('');
      await loadDrops();
      setActiveDrop(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create Drop');
    } finally {
      setCreatingDrop(false);
    }
  }

  async function handleDeleteDrop(drop: Drop) {
    if (!confirm(`Are you sure you want to delete Drop "${drop.title}" early?\nThis will remove it immediately from public view.`)) {
      return;
    }

    const toastId = toast.loading('Deleting Drop...');
    try {
      await api.delete(`/drops/${drop.id}`);
      toast.success('Drop deleted early successfully', { id: toastId });
      if (activeDrop?.id === drop.id) setActiveDrop(null);
      loadDrops();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed', { id: toastId });
    }
  }

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
    const toastId = toast.loading('Uploading image...');
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Sparkles size={22} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Video Drops</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              5-Day Auto-TTL
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage YouTube product showcase drops. Products displayed here auto-expire after 5 days, or can be deleted early.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setCreateDropOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Video Drop
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
            New video uploads from YouTube are auto-detected by cron once daily, or you can manually create a Drop right now by pasting a YouTube link.
          </p>
          <button
            onClick={() => setCreateDropOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} /> Create First Video Drop
          </button>
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
                    {/* Thumbnail */}
                    <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 group shadow-sm">
                      <img
                        src={drop.thumbnailUrl || `https://img.youtube.com/vi/${drop.youtubeVideoId}/hqdefault.jpg`}
                        alt={drop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <a
                        href={drop.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white"
                        title="Watch on YouTube"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white grid place-items-center shadow-lg">
                          <Play size={18} fill="white" />
                        </div>
                      </a>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            timeInfo.urgent
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Clock size={12} /> {timeInfo.label}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {drop.youtubeVideoId}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 line-clamp-2">
                        {drop.title || 'Untitled Video Drop'}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>Added: {new Date(drop.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {drop.products?.length || 0} Products Attached
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end md:self-center">
                    <button
                      onClick={() => openAddProduct(drop)}
                      className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <Plus size={15} /> Add Product
                    </button>
                    <a
                      href={drop.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 text-slate-700"
                    >
                      <ExternalLink size={14} /> View Video
                    </a>
                    <button
                      onClick={() => handleDeleteDrop(drop)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                      title="Delete Drop Early"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Products in this Drop */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Products in this video ({drop.products?.length || 0})
                    </h4>
                    {drop.products?.length > 0 && (
                      <button
                        onClick={() => openAddProduct(drop)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                      >
                        <Plus size={13} /> Add another
                      </button>
                    )}
                  </div>

                  {!drop.products || drop.products.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <Package size={24} className="mx-auto text-slate-400 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">No products added to this Drop yet</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add the fabrics or sarees shown in this video so customers can order them.
                      </p>
                      <button
                        onClick={() => openAddProduct(drop)}
                        className="mt-3 btn-secondary text-xs py-1.5 px-3"
                      >
                        + Add First Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {drop.products.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 group relative hover:border-slate-300 transition"
                        >
                          <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                            {p.imageUrl ? (
                              <img
                                src={resolveImage(p.imageUrl)}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-slate-400">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-slate-900 truncate">{p.title}</h5>
                            <p className="text-xs font-semibold text-brand-700 mt-0.5">{p.price}</p>
                            {p.details && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">{p.details}</p>
                            )}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  p.inStock
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {p.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 p-1 rounded-lg shadow-sm border border-slate-100">
                            <button
                              onClick={() => openEditProduct(drop, p)}
                              className="p-1 text-slate-600 hover:text-brand-600 rounded"
                              title="Edit product"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(drop, p.id)}
                              className="p-1 text-rose-600 hover:text-rose-700 rounded"
                              title="Remove product"
                            >
                              <Trash2 size={13} />
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

      {/* MODAL: Create New Drop Manually */}
      {createDropOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Create Video Drop</h3>
              </div>
              <button
                onClick={() => setCreateDropOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDrop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YouTube Video URL or ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or Video ID"
                  value={newDropUrl}
                  onChange={(e) => setNewDropUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepts full YouTube URL, Shorts URL, or 11-char Video ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drop Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pure Rayon Print Collection"
                  value={newDropTitle}
                  onChange={(e) => setNewDropTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
                <Clock size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  This Drop will automatically be live for <strong>5 days</strong> and expire on schedule via MongoDB TTL.
                </span>
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

      {/* MODAL: Add / Edit Product in Drop */}
      {productModalOpen && activeDrop && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add Product to Drop'}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{activeDrop.title}</p>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
