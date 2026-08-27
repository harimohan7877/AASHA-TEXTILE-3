import { useState, useEffect } from 'react';
import { useDrops, useSettings, whatsappLink, Drop, DropProduct } from './usePublicData';
import { resolveImage } from '../lib/api';
import {
  Sparkles,
  Clock,
  ExternalLink,
  MessageCircle,
  Package,
  Play,
  Share2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WhatsAppIcon } from './PublicHeader';
import toast from 'react-hot-toast';

function formatTimeRemaining(expiresAtStr: string): { label: string; urgent: boolean } {
  try {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return { label: 'Expiring today', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 1) {
      return { label: `⏳ ${days} days remaining`, urgent: false };
    }
    if (days === 1) {
      return { label: `⏳ 1 day, ${hours} hrs remaining`, urgent: true };
    }
    return { label: `🔥 Ending soon: ${hours} hrs left`, urgent: true };
  } catch {
    return { label: '5-Day Limited Drop', urgent: false };
  }
}

export default function DropsPage() {
  const { data: drops, isLoading } = useDrops();
  const { data: settings } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Video Drops — Limited 5-Day Wholesale Collections | ${settings?.store_name || 'Aasha Textile'}`;
  }, [settings]);

  function handleShareDrop(drop: Drop) {
    if (navigator.share) {
      navigator
        .share({
          title: drop.title || 'Aasha Textile Video Drop',
          text: `Check out latest wholesale fabric collection from video: "${drop.title}" on Aasha Textile (Available for 5 days only!)`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Top Banner / Hero */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 text-white pt-28 sm:pt-36 pb-14 px-4">
        <div className="pub-container text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles size={14} className="animate-pulse text-amber-400" />
            5-Day Limited Release Drops
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            YouTube Video Drops
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Directly from DevKrishna Sharma's latest YouTube showcase videos. Browse exact fabric pieces shown in each video and order instantly on WhatsApp.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-stone-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" /> Auto-expires in 5 days
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> 100% Genuine Wholesale Rates
            </span>
            <span className="flex items-center gap-1.5">
              <Package size={14} className="text-brand-400" /> Pan-India Dispatch
            </span>
          </div>
        </div>
      </section>

      {/* Drops Feed */}
      <div className="pub-container mt-10 max-w-5xl mx-auto px-4">
        {isLoading ? (
          <div className="py-24 grid place-items-center">
            <div className="animate-spin h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full" />
            <p className="text-sm text-stone-500 mt-3 font-medium">Loading latest Video Drops...</p>
          </div>
        ) : !drops || drops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl grid place-items-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-900 font-display">No Active Video Drops Right Now</h3>
            <p className="text-stone-500 text-sm mt-2 mb-6">
              New video drops are added every 2 days with each YouTube upload. In the meantime, you can explore our complete fabric catalog.
            </p>
            <Link
              to="/"
              className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold"
            >
              Browse Full Catalog <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {drops.map((drop, idx) => {
              const timeInfo = formatTimeRemaining(drop.expiresAt);

              return (
                <article
                  key={drop.id}
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition hover:shadow-md"
                >
                  {/* Drop Top Bar */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                          Drop #{drops.length - idx}
                        </span>
                        <span
                          className={`text-xs font-semibold px-3 py-0.5 rounded-full ${
                            timeInfo.urgent
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {timeInfo.label}
                        </span>
                        <span className="text-xs text-stone-400">
                          Added:{' '}
                          {new Date(drop.addedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                        {drop.title || 'Featured YouTube Showcase'}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleShareDrop(drop)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-stone-600 rounded-xl"
                        title="Share this drop"
                      >
                        <Share2 size={14} /> Share
                      </button>
                      <a
                        href={drop.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border-stone-200"
                      >
                        <Play size={13} fill="currentColor" /> Open in YouTube
                      </a>
                    </div>
                  </div>

                  {/* YouTube Embedded Video Player */}
                  <div className="p-4 sm:p-6 bg-stone-900">
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black max-w-4xl mx-auto border border-stone-800">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${drop.youtubeVideoId}?rel=0&modestbranding=1`}
                        title={drop.title || 'YouTube Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>

                  {/* Products Grid for this Video */}
                  <div className="p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-100">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display flex items-center gap-2">
                          <Tag size={18} className="text-brand-600" />
                          Items Shown in this Video
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Tap WhatsApp to order or enquire about wholesale quantity & designs
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                        {drop.products?.length || 0} Products
                      </span>
                    </div>

                    {!drop.products || drop.products.length === 0 ? (
                      <div className="p-8 bg-stone-50 rounded-2xl text-center border border-dashed border-stone-200">
                        <Package size={28} className="mx-auto text-stone-400 mb-2" />
                        <p className="text-sm font-semibold text-stone-700">Product details being updated</p>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                          You can still send a screenshot of this video to WhatsApp to inquire directly.
                        </p>
                        <a
                          href={whatsappLink(
                            settings?.whatsapp,
                            `Hi Krishna Bhai, I watched your video "${drop.title}" (${drop.youtubeUrl}) and would like to know price and wholesale availability of the items shown.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 rounded-xl"
                        >
                          <WhatsAppIcon className="w-4 h-4" /> Inquire on WhatsApp
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {drop.products.map((prod) => {
                          const orderMessage = `Hi Aasha Textile, I want to order/enquire about this item shown in your Video Drop:
*Product:* ${prod.title}
*Price:* ${prod.price}
*Video:* ${drop.title} (${drop.youtubeUrl})
Please share available colors and wholesale booking process.`;

                          return (
                            <div
                              key={prod.id}
                              className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden flex flex-col hover:border-brand-300 hover:shadow-md transition duration-200"
                            >
                              {/* Product Image */}
                              <div className="relative aspect-square bg-stone-100 overflow-hidden">
                                {prod.imageUrl ? (
                                  <img
                                    src={resolveImage(prod.imageUrl)}
                                    alt={prod.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full grid place-items-center text-stone-400 bg-stone-100">
                                    <Package size={36} />
                                  </div>
                                )}

                                <div className="absolute top-3 left-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm backdrop-blur-md ${
                                      prod.inStock
                                        ? 'bg-emerald-600/90 text-white'
                                        : 'bg-rose-600/90 text-white'
                                    }`}
                                  >
                                    {prod.inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h4 className="font-bold text-stone-900 text-sm sm:text-base line-clamp-2 leading-snug">
                                    {prod.title}
                                  </h4>
                                  <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-base sm:text-lg font-bold text-brand-700 font-display">
                                      {prod.price}
                                    </span>
                                  </div>
                                  {prod.details && (
                                    <p className="mt-2 text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                                      {prod.details}
                                    </p>
                                  )}
                                </div>

                                {/* WhatsApp CTA */}
                                <a
                                  href={whatsappLink(settings?.whatsapp, orderMessage)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-98"
                                >
                                  <WhatsAppIcon className="w-4 h-4" />
                                  Order on WhatsApp
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
