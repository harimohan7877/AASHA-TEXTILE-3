import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Award, MessageCircleHeart, Phone, MapPin, Play, BadgeCheck, Clock } from 'lucide-react';
import { useCategories, useProducts, useSettings, useVideos, whatsappLink } from './usePublicData';
import { resolveImage } from '../lib/api';
import ProductCard from './ProductCard';
import { WhatsAppIcon } from './PublicHeader';
import TestimonialsSection from './TestimonialsSection';
import { useMemo, useState } from 'react';

const DEFAULT_HERO = '';
export default function Home() {
  const settings = useSettings();
  const cats = useCategories();
  const featured = useProducts({ featured: true, limit: 8 });
  const all = useProducts({ limit: 500 });
  const videos = useVideos();

  const visibleCats = useMemo(() => (cats || []).filter(c => (c.product_count || 0) > 0), [cats]);

  // Auto-build a first-image fallback per category from products
  const catImage = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    (all || []).forEach(p => {
      if (p.image_url && !m[p.category]) m[p.category] = p.image_url;
    });
    return m;
  }, [all]);

  const heroImg = settings?.hero_image_url ? resolveImage(settings.hero_image_url) : DEFAULT_HERO;
  const storeName = settings?.store_name || 'Aasha Textile';
  const tagline = settings?.tagline || 'Quality Fabric, Wholesale Price';

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[88vh] sm:min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
<div className="absolute inset-0 bg-gradient-to-br from-stone-900/85 via-stone-900/75 to-stone-900/50"/>          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-cream-50"/>
        </div>
        <div className="relative pub-container pt-28 pb-20 text-white w-full">
          <div className="max-w-3xl">
            <span className="inline-block text-[11px] font-semibold tracking-[0.22em] uppercase text-brand-200 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full animate-fadeUp">Trusted Wholesale Textile{settings?.established_year ? ` · Since ${settings.established_year}` : ''}</span>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-tight animate-fadeUp delay-100">
              {storeName}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-xl animate-fadeUp delay-200">
              {tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fadeUp delay-300">
              <a href="#collection" className="pub-btn !bg-white !text-stone-900 hover:!bg-cream-100">
                Explore Collection <ArrowRight size={16}/>
              </a>
              <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp">
                <WhatsAppIcon className="w-4 h-4"/> WhatsApp Us
              </a>
            </div>
            {(settings?.gst_number || settings?.udyam_number) && (
              <div className="mt-7 flex flex-wrap gap-2 animate-fadeUp delay-400" data-testid="hero-trust-badges">
                {settings?.gst_number && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded-full">
                    <BadgeCheck size={13} className="text-emerald-300"/> GST Verified
                  </span>
                )}
                {settings?.udyam_number && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded-full">
                    <BadgeCheck size={13} className="text-amber-300"/> MSME Registered
                  </span>
                )}
                {settings?.business_hours && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded-full">
                    <Clock size={13} className="text-white/85"/> {settings.business_hours}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="pub-container -mt-8 sm:-mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-soft border border-stone-100 p-5 sm:p-7 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-100">
          {[
            { icon: Award,        title: 'Premium Quality',    desc: 'Trusted fabric, every meter' },
            { icon: Truck,        title: 'Fast Delivery',      desc: 'Pan-India wholesale dispatch' },
            { icon: ShieldCheck,  title: 'Wholesale Prices',   desc: 'Best rates, no middlemen' },
            { icon: MessageCircleHeart, title: 'WhatsApp Support', desc: 'Instant queries answered' },
          ].map((f, i) => (
            <div key={i} className="px-4 py-4 md:py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><f.icon size={18}/></div>
              <div>
                <div className="text-sm font-semibold text-stone-900">{f.title}</div>
                <div className="text-xs text-stone-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="collection" className="pub-section">
        <div className="pub-container">
         <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
            <div>
              <span className="pub-eyebrow">Shop by Fabric</span>
              <h2 className="pub-heading mt-3">Our Collections</h2>
              <p className="mt-2 text-stone-600 max-w-lg">Hand-picked fabric categories — explore what fits your store.</p>
            </div>
          </div>
          {/* Flipkart-style quick search */}
          <form onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value?.trim(); if(v) window.location.href=`/search?q=${encodeURIComponent(v)}`; }} className="mb-10">
            <div className="relative max-w-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="search"
                placeholder="Search fabric, category, variety..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-stone-400"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition">
                Search
              </button>
            </div>
          </form>
          {!cats ? (
            <GridSkeleton aspect="aspect-[4/3]" count={6} />
          ) : visibleCats.length === 0 ? (
            <div className="py-14 text-center text-stone-500">Collections coming soon.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {visibleCats.map((c) => {
                const img = c.image_url ? resolveImage(c.image_url) : (catImage[c.name] ? resolveImage(catImage[c.name]!) : '');
                return (
                  <Link key={c.name} to={`/category/${encodeURIComponent(c.slug || c.name.toLowerCase())}`}
                    className="group relative block overflow-hidden rounded-2xl ring-1 ring-stone-900/5 bg-cream-100 aspect-[4/3] shadow-sm hover:shadow-soft transition-shadow">
                    {img ? (
                      <img src={img} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                    ) : <div className="w-full h-full grid place-items-center text-stone-300 font-display text-4xl">A</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/30 to-transparent"/>
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                      <div className="font-display text-xl sm:text-2xl font-semibold">{c.name}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-white/80">{c.product_count} products</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase bg-white/10 backdrop-blur px-2.5 py-1 rounded-full border border-white/15">
                          Explore <ArrowRight size={12}/>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featured && featured.length > 0 && (
        <section className="pub-section bg-gradient-to-b from-transparent to-cream-100/60">
          <div className="pub-container">
            <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
              <div>
                <span className="pub-eyebrow">Bestsellers</span>
                <h2 className="pub-heading mt-3">Featured Products</h2>
              </div>
              {visibleCats[0] && (
                <Link to={`/category/${encodeURIComponent(visibleCats[0].slug || visibleCats[0].name.toLowerCase())}`} className="text-sm font-semibold text-stone-900 hover:text-brand-700 flex items-center gap-1">
                  View all <ArrowRight size={14}/>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((p) => (<ProductCard key={p.id} p={p} />))}
            </div>
          </div>
        </section>
      )}

      {/* VIDEOS */}
      {videos && videos.length > 0 && (
        <section className="pub-section">
          <div className="pub-container">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
              <div className="max-w-xl">
                <span className="pub-eyebrow">Watch</span>
                <h2 className="pub-heading mt-3">See Our Collection</h2>
                <p className="mt-2 text-stone-600">Short videos showing fabric quality, colors and texture.</p>
              </div>
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noreferrer" data-testid="visit-yt-channel"
                   className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-semibold shadow-sm hover:shadow-md transition">
                  <YoutubeIcon className="w-4 h-4"/> Visit YouTube Channel
                </a>
              )}
            </div>
            <VideoGrid videos={videos} />
          </div>
        </section>
      )}

      {/* ABOUT STRIP */}
      <section className="pub-section bg-stone-900 text-white">
        <div className="pub-container grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-300 bg-white/5 px-3 py-1 rounded-full">About</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold mt-4 leading-tight">Crafted for retailers who value quality.</h2>
            <p className="mt-5 text-white/75 leading-relaxed">{settings?.about || 'We supply premium wholesale textile — Rayon, Cotton, Silk, Readymade and more — directly to retailers across India. Trust, quality, and fair pricing have defined us for years.'}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/about" className="pub-btn !bg-white !text-stone-900 hover:!bg-cream-100">Our Story <ArrowRight size={14}/></Link>
              <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp"><WhatsAppIcon className="w-4 h-4"/> Chat Now</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: (all?.length ?? 0).toString(), l: 'Products' },
              { n: visibleCats.length.toString(), l: 'Categories' },
              { n: settings?.happy_customers || '1000+', l: 'Happy Customers' },
              { n: settings?.years_of_trust || '10+', l: 'Years of Trust' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="font-display text-4xl lg:text-5xl font-semibold text-white">{stat.n}</div>
                <div className="mt-1 text-sm text-white/70">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* CONTACT */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="bg-white rounded-3xl shadow-soft border border-stone-100 p-8 sm:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="pub-eyebrow">Get in Touch</span>
              <h2 className="pub-heading mt-3">Let's talk about your store</h2>
              <p className="mt-2 text-stone-600">Message us on WhatsApp or call anytime during business hours.</p>
              <div className="mt-6 space-y-3">
                {settings?.phone && <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-stone-700 hover:text-stone-900"><div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center"><Phone size={16}/></div><div><div className="text-xs text-stone-500">Call us</div><div className="font-semibold">{settings.phone}</div></div></a>}
                {settings?.address && <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><MapPin size={16}/></div><div><div className="text-xs text-stone-500">Visit us</div><div className="font-semibold text-stone-800">{settings.address}</div></div></div>}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#128C7E] to-[#25D366] text-white rounded-2xl p-8">
              <WhatsAppIcon className="w-10 h-10 text-white/90"/>
              <h3 className="font-display text-2xl font-semibold mt-4">Chat on WhatsApp</h3>
              <p className="mt-2 text-white/85">Share your requirements and get a quick quotation.</p>
              <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#128C7E] font-semibold hover:bg-cream-100 transition">
                Send Message <ArrowRight size={16}/>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function VideoGrid({ videos }: { videos: any[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 2;
  const visible = showAll ? videos : videos.slice(0, INITIAL);
  const hidden = videos.length - INITIAL;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {visible.map((v) => (
          <button key={v.id} onClick={() => setActive(v.video_id)} data-testid={`video-${v.video_id}`} className="group relative block rounded-2xl overflow-hidden aspect-video bg-stone-900 text-left ring-1 ring-stone-900/5 shadow-sm hover:shadow-soft transition-shadow">
            {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"/> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent"/>
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur text-stone-900 grid place-items-center group-hover:scale-110 transition-transform shadow-lg"><Play size={22} fill="currentColor"/></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="text-white text-sm font-semibold line-clamp-2">{v.title}</div>
            </div>
          </button>
        ))}
      </div>

      {videos.length > INITIAL && (
        <div className="mt-7 flex justify-center">
          <button onClick={() => setShowAll((s) => !s)} data-testid="videos-toggle"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-300 bg-white hover:bg-cream-100 hover:border-stone-400 text-sm font-semibold text-stone-800 transition">
            {showAll ? 'Show less' : `See ${hidden} more video${hidden > 1 ? 's' : ''}`}
            <ArrowRight size={14} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'}/>
          </button>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-stone-900/80 animate-fadeIn" onClick={() => setActive(null)}>
          <div className="max-w-4xl w-full aspect-video">
            <iframe src={`https://www.youtube.com/embed/${active}?autoplay=1&rel=0`} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-2xl shadow-2xl"/>
          </div>
        </div>
      )}
    </>
  );
}

function YoutubeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z"/>
    </svg>
  );
}

function GridSkeleton({ aspect = 'aspect-[4/5]', count = 8 }: { aspect?: string; count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${aspect} rounded-2xl bg-cream-100 animate-pulse`}/>
      ))}
    </div>
  );
}
