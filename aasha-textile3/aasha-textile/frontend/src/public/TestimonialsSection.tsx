import { useEffect, useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTestimonials } from './usePublicData';
import { resolveImage } from '../lib/api';

export default function TestimonialsSection() {
  const items = useTestimonials();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const t = setInterval(() => setActive((p) => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[active];
  const prev = () => setActive((p) => (p - 1 + items.length) % items.length);
  const next = () => setActive((p) => (p + 1) % items.length);

  return (
    <section className="pub-section bg-cream-100/50 border-y border-stone-200/60">
      <div className="pub-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="pub-eyebrow">Customer Voices</span>
          <h2 className="pub-heading mt-3">Loved by retailers across India</h2>
          <p className="mt-3 text-stone-600">Real words from real shop owners who trust us with their fabric needs.</p>
        </div>

        {/* Featured (rotating) */}
        <div className="relative max-w-3xl mx-auto" data-testid="testimonials-carousel">
          <div className="bg-white rounded-3xl shadow-soft border border-stone-100 p-7 sm:p-10 relative overflow-hidden">
            <Quote className="absolute -top-2 -left-2 text-cream-100" size={120} strokeWidth={1}/>
            <div className="relative">
              <div className="flex items-center gap-1 text-amber-500 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill={i < (current.rating || 5) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="font-display text-xl sm:text-2xl text-stone-800 leading-relaxed">
                "{current.message}"
              </p>
              <div className="mt-7 pt-5 border-t border-stone-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white grid place-items-center font-semibold overflow-hidden flex-shrink-0">
                  {current.avatar_url ? <img src={resolveImage(current.avatar_url)} alt={current.author_name} className="w-full h-full object-cover"/> : current.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-900">{current.author_name}</div>
                  <div className="text-xs text-stone-500 truncate">
                    {current.author_role}{current.city ? ` · ${current.city}` : ''}
                  </div>
                </div>
                {items.length > 1 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={prev} aria-label="Previous" className="w-9 h-9 rounded-full grid place-items-center bg-cream-100 hover:bg-cream-200 text-stone-700 transition" data-testid="testimonial-prev"><ChevronLeft size={16}/></button>
                    <button onClick={next} aria-label="Next" className="w-9 h-9 rounded-full grid place-items-center bg-stone-900 hover:bg-stone-800 text-white transition" data-testid="testimonial-next"><ChevronRight size={16}/></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5">
              {items.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} aria-label={`Go to testimonial ${i+1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-stone-900' : 'w-1.5 bg-stone-300 hover:bg-stone-400'}`}
                  data-testid={`testimonial-dot-${i}`}/>
              ))}
            </div>
          )}
        </div>

        {/* Mini grid of other testimonials */}
        {items.length > 1 && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {items.filter((_, i) => i !== active).slice(0, 3).map((t) => (
              <button key={t.id} onClick={() => setActive(items.findIndex((x) => x.id === t.id))} className="text-left p-5 rounded-2xl bg-white/70 border border-stone-200/70 hover:border-stone-300 hover:bg-white hover:shadow-soft transition">
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={12} fill={i < (t.rating || 5) ? 'currentColor' : 'none'}/>))}
                </div>
                <p className="text-sm text-stone-700 line-clamp-3">"{t.message}"</p>
                <div className="mt-3 text-xs font-semibold text-stone-900">{t.author_name}</div>
                <div className="text-[11px] text-stone-500">{t.city}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
