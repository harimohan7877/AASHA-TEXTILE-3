import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Award, ShieldCheck, Truck, RotateCcw, BadgeCheck, ShoppingCart, X, ZoomIn, Send, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { useProducts, useSettings, whatsappLink, slugify, useCart } from './usePublicData';
import ProductCard from './ProductCard';
import { WhatsAppIcon } from './PublicHeader';
import type { Product } from './usePublicData';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: settings } = useSettings();
const [p, setP] = useState<Product | null | undefined>(undefined);
  const [activeImg, setActiveImg] = useState<string>('');
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // ✅ Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);

  function handleAddToCart() {
    if (!p) return;
    addToCart(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

useEffect(() => {
    if (!id) return;
    setP(undefined);
    setActiveImg('');
    setReviews([]);
    api.get(`/public/products/${id}`).then(r => {
      setP(r.data);
      setActiveImg(r.data?.image_url || '');
    }).catch(() => setP(null));

    api.get('/reviews', { params: { product_id: id, approved_only: true } })
      .then(r => setReviews(r.data.items || []))
      .catch(() => setReviews([]));
  }, [id]);

  // ✅ NAYA — Tab title product ke naam se set hoga
  useEffect(() => {
    if (p?.name) document.title = `${p.name_en || p.name} — Aasha Textile`;
  }, [p]);

  // ✅ JSON-LD Structured Data for SEO
  useEffect(() => {
    if (!p) return;
    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.name,
      "description": p.info || `${p.name} — premium wholesale fabric from Aasha Textile`,
      "image": p.image_url ? [resolveImage(p.image_url)] : [],
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "availability": p.stock_status === 'out_of_stock'
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      },
      "brand": { "@type": "Brand", "name": "Aasha Textile" },
      "category": p.category,
    };
    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'product-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(productJsonLd);
    document.head.appendChild(script);
    return () => { document.getElementById('product-jsonld')?.remove(); };
  }, [p]);

  // ✅ Dynamic Open Graph tags for social sharing
  useEffect(() => {
    if (!p) return;
    const imgUrl = p.image_url ? resolveImage(p.image_url) : '';
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', `${p.name}${p.name_en ? ` (${p.name_en})` : ''} — Aasha Textile`);
    setMeta('og:description', p.info || `${p.name} — premium wholesale fabric from Aasha Textile`);
    if (imgUrl) setMeta('og:image', imgUrl);
    setMeta('og:url', `https://aashatextile.com/product/${p.id}`);
    return () => {
      // Reset to home page OG on unmount
      const el = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (el) el.setAttribute('content', 'Aasha Textile — Premium Wholesale Fabric');
    };
  }, [p]);

  const { data: related } = useProducts(p ? { category: p.category, limit: 8 } : { limit: 0 });

  if (p === null) return <Navigate to="/" replace />;
  if (p === undefined) return <div className="pt-40 pb-20 pub-container"><div className="h-96 rounded-3xl bg-cream-100 animate-pulse"/></div>;

  const out = p.stock_status === 'out_of_stock';
  const whatsappText = `Hi, I'm interested in "${p.name}${p.name_en ? ` (${p.name_en})` : ''}" ${p.rate ? '— ' + p.rate : ''}. Can you share more details?`;

  return (
    <>
      <section className="pt-24 pb-8">
        <div className="pub-container">
          <nav className="flex items-center gap-2 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <Link to={`/category/${encodeURIComponent(slugify(p.category))}`} className="hover:text-stone-900">{p.category}</Link>
            <span>/</span>
            <span className="text-stone-900 truncate">{p.name_en || p.name}</span>
          </nav>
        </div>
      </section>

      <section className="pb-16">
        <div className="pub-container grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
         {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main image - click to zoom */}
            <div
              className="relative rounded-3xl overflow-hidden bg-cream-100 ring-1 ring-stone-900/5 shadow-soft aspect-square cursor-zoom-in group"
              onClick={() => { setLightboxImg(activeImg || p.image_url || ''); setLightboxOpen(true); }}
            >
              {activeImg || p.image_url ? (
                <img src={resolveImage(activeImg || p.image_url || '')} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"/>
              ) : <div className="w-full h-full grid place-items-center text-stone-300 font-display text-7xl">A</div>}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {p.is_featured && <span className="inline-flex items-center gap-1 bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1.5 rounded-full"><Star size={12} fill="currentColor"/> Bestseller</span>}
                {out && <span className="inline-flex items-center bg-red-600/95 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1.5 rounded-full">Out of Stock</span>}
              </div>
              <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <ZoomIn size={20} className="text-stone-700"/>
              </div>
            </div>
            {/* Thumbnails — sirf tab dikhenge jab multiple images hon */}
            {p.images && p.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {p.images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImg(img)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${activeImg === img ? 'border-brand-600' : 'border-transparent hover:border-stone-300'}`}>
                    <img src={resolveImage(img)} alt={`view ${idx + 1}`} className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:pt-4">
            <Link to={`/category/${encodeURIComponent(slugify(p.category))}`} className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"><ArrowLeft size={14}/> Back to {p.category}</Link>
            <span className="pub-eyebrow mt-5 inline-block">{p.category}{p.variety ? ` • ${p.variety}` : ''}</span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-3 text-stone-900">{p.name}</h1>
            {p.name_en && <p className="mt-1 text-stone-500">{p.name_en}</p>}

            {p.rate && (
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold text-brand-700">{p.rate}</span>
                <span className="text-xs text-stone-500">wholesale</span>
              </div>
            )}

            {p.info && <p className="mt-5 text-stone-600 leading-relaxed">{p.info}</p>}

            {/* Specs */}
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {p.variety && <Spec k="Variety" v={p.variety}/>}
              {p.cut && <Spec k="Cut" v={p.cut}/>}
              {p.panna && <Spec k="Panna (Width)" v={p.panna}/>}
              <Spec k="Stock" v={out ? 'Out of Stock' : 'Available'} />
            </dl>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
<a href={whatsappLink(settings?.whatsapp, whatsappText)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp !py-3.5 !px-6"><WhatsAppIcon className="w-5 h-5"/> WhatsApp Enquiry</a>
              {!out && (
                <button onClick={handleAddToCart} className={`pub-btn !py-3.5 !px-6 transition-all ${added ? '!bg-green-600 !text-white' : '!bg-stone-100 !text-stone-900 hover:!bg-stone-200'}`}>
                  <ShoppingCart size={16}/> {added ? 'Cart mein add hua ✓' : 'Add to Cart'}
                </button>
              )}
              {settings?.phone && <a href={`tel:${settings.phone}`} className="pub-btn-outline !py-3.5 !px-6"><Phone size={16}/> Call Now</a>}
            </div>

            {/* Trust */}
            <div className="mt-8 pt-6 border-t border-stone-200 grid grid-cols-3 gap-4 text-xs">
              {[
                { icon: Award, label: 'Premium Quality' },
                { icon: ShieldCheck, label: 'Trusted Seller' },
                { icon: Truck, label: 'Pan-India Shipping' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-stone-600">
                  <f.icon size={16} className="text-brand-700"/>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Policy snippets */}
            <div className="mt-6 grid sm:grid-cols-3 gap-2 text-xs" data-testid="product-policy-snippets">
              <Link to="/policies/shipping" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-100/70 border border-stone-200/70 text-stone-700 hover:bg-cream-100 hover:border-stone-300 transition">
                <Truck size={14} className="text-brand-700"/>
                <span className="font-semibold">Shipping & Delivery</span>
              </Link>
              <Link to="/policies/returns" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-100/70 border border-stone-200/70 text-stone-700 hover:bg-cream-100 hover:border-stone-300 transition">
                <RotateCcw size={14} className="text-brand-700"/>
                <span className="font-semibold">7-day Return</span>
              </Link>
              {settings?.gst_number ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <BadgeCheck size={14}/>
                  <span className="font-semibold">GST Invoice Available</span>
                </div>
              ) : (
                <Link to="/policies/privacy" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-100/70 border border-stone-200/70 text-stone-700 hover:bg-cream-100 hover:border-stone-300 transition">
                  <ShieldCheck size={14} className="text-brand-700"/>
                  <span className="font-semibold">Privacy Protected</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related && related.filter(r => r.id !== p.id).length > 0 && (
        <section className="pub-section bg-cream-100/40 border-t border-stone-200/60">
          <div className="pub-container">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <h2 className="pub-heading !text-3xl">More from {p.category}</h2>
              <Link to={`/category/${encodeURIComponent(slugify(p.category))}`} className="text-sm font-semibold text-stone-900 hover:text-brand-700">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.filter(r => r.id !== p.id).slice(0, 8).map((rp) => <ProductCard key={rp.id} p={rp}/>)}
            </div>
          </div>
        </section>
      )}

      {/* ✅ Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={() => setLightboxOpen(false)}>
            <X size={24}/>
          </button>
          <img src={resolveImage(lightboxImg)} alt={p.name} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}

      {/* ✅ Reviews List Section */}
      <section className="pub-section bg-cream-50/50 border-t border-stone-200/60">
        <div className="pub-container max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="pub-heading !text-2xl">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 text-sm font-semibold">
                <Star size={14} className="text-amber-400 fill-amber-400"/>
                <span>
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5 ({reviews.length})
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-stone-500 text-center py-6">Abhi tak koi reviews nahi hain. Pehle banne ke liye review likhein!</p>
          ) : (
            <div className="space-y-4 mb-8">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed mb-2">{rev.message}</p>
                  <div className="text-xs font-semibold text-stone-500">
                    — {rev.author_name} {rev.city && <span className="text-stone-400 font-normal">({rev.city})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ✅ Write Review Form */}
      <ReviewForm productId={p.id} productName={p.name} />
    </>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-200 pb-2">
      <dt className="text-stone-500">{k}</dt>
      <dd className="font-medium text-stone-900 text-right">{v}</dd>
    </div>
  );
}

// ✅ Write Review Form Component
function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ author_name: '', author_email: '', rating: 5, message: '', city: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author_name.trim() || !form.message.trim()) {
      toast.error('Name aur message zaroori hain');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { ...form, product_id: productId });
      toast.success('Review submit ho gaya! Admin approval ke baad publish hoga.');
      setShowForm(false);
      setForm({ author_name: '', author_email: '', rating: 5, message: '', city: '' });
    } catch {
      toast.error('Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="pub-section bg-cream-50">
      <div className="pub-container max-w-2xl">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="pub-btn-primary w-full justify-center !py-4">
            <Star size={18} className="fill-white"/> Write a Review
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-semibold text-stone-900">Write Review for {productName}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your Name *</label>
                  <input required value={form.author_name} onChange={e => setForm({...form, author_name: e.target.value})}
                    className="input" placeholder="Aapka naam"/>
                </div>
                <div>
                  <label className="label">City (Optional)</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="input" placeholder="e.g. Jaipur, Rajasthan"/>
                </div>
              </div>

              <div>
                <label className="label">Your Rating *</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setForm({...form, rating: star})}>
                      <Star size={28} className={`transition ${star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}/>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Your Review *</label>
                <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="input resize-none" placeholder="Is product ke baare mein aapki raay..."/>
              </div>

              <button type="submit" disabled={submitting} className="pub-btn-primary w-full justify-center !py-3">
                {submitting ? <><Loader2 size={18} className="animate-spin"/> Submitting...</> : <><Send size={18}/> Submit Review</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
