import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Award, ShieldCheck, Truck, RotateCcw, BadgeCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { useProducts, useSettings, whatsappLink, slugify } from './usePublicData';
import ProductCard from './ProductCard';
import { WhatsAppIcon } from './PublicHeader';
import type { Product } from './usePublicData';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const settings = useSettings();
  const [p, setP] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    setP(undefined);
    api.get(`/products/${id}`).then(r => setP(r.data)).catch(() => setP(null));
  }, [id]);

  const related = useProducts(p ? { category: p.category, limit: 8 } : { limit: 0 });

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
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden bg-cream-100 ring-1 ring-stone-900/5 shadow-soft aspect-square">
            {p.image_url ? (
              <img src={resolveImage(p.image_url)} alt={p.name} className="w-full h-full object-cover"/>
            ) : <div className="w-full h-full grid place-items-center text-stone-300 font-display text-7xl">A</div>}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {p.is_featured && <span className="inline-flex items-center gap-1 bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1.5 rounded-full"><Star size={12} fill="currentColor"/> Bestseller</span>}
              {out && <span className="inline-flex items-center bg-red-600/95 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1.5 rounded-full">Out of Stock</span>}
            </div>
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
