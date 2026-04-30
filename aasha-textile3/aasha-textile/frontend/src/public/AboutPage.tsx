import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Award, ShieldCheck, Truck, Users, BadgeCheck, Clock, Building2 } from 'lucide-react';
import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';
import { resolveImage } from '../lib/api';
import TestimonialsSection from './TestimonialsSection';

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2000&q=70';

export default function AboutPage() {
  const s = useSettings();
  const hero = s?.hero_image_url ? resolveImage(s.hero_image_url) : DEFAULT_HERO;

  const credentials = [
    s?.gst_number && { icon: BadgeCheck, label: 'GST Number', value: s.gst_number, color: 'emerald' },
    s?.udyam_number && { icon: BadgeCheck, label: 'Udyam / MSME', value: s.udyam_number, color: 'amber' },
    s?.established_year && { icon: Building2, label: 'Established', value: `Since ${s.established_year}`, color: 'sky' },
    s?.business_hours && { icon: Clock, label: 'Business Hours', value: s.business_hours, color: 'violet' },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string; color: string }>;

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  };

  return (
    <>
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/55 to-cream-50"/>
        <div className="relative pub-container pt-32 pb-16 text-white">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6"><ArrowLeft size={14}/> Back to Home</Link>
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-200 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">Our Story</span>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold mt-4 max-w-3xl leading-[1.02]">About {s?.store_name || 'Aasha Textile'}</h1>
          <p className="mt-4 text-white/85 max-w-2xl">{s?.tagline || 'Quality Fabric, Wholesale Price'}</p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <span className="pub-eyebrow">Who we are</span>
            <h2 className="pub-heading mt-3">A trusted name in wholesale textile.</h2>
            <div className="mt-6 text-stone-700 leading-relaxed space-y-4 whitespace-pre-line">
              {s?.about || 'We supply premium wholesale textile — Rayon, Cotton, Silk, Readymade and more — directly to retailers across India. Trust, quality, and fair pricing have defined us for years. Every meter we deliver is the result of careful selection and strict quality checks.'}
            </div>

            {/* Trust Credentials */}
            {credentials.length > 0 && (
              <div className="mt-10" data-testid="about-credentials">
                <h3 className="font-display text-2xl font-semibold text-stone-900">Verified Business Credentials</h3>
                <p className="text-sm text-stone-500 mt-1">Registered, compliant and ready to invoice.</p>
                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  {credentials.map((c, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${colorMap[c.color]}`}>
                      <div className="w-10 h-10 rounded-xl bg-white grid place-items-center flex-shrink-0 border border-current/10"><c.icon size={18}/></div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{c.label}</div>
                        <div className="font-semibold mt-0.5 break-all">{c.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {[
                { icon: Award, t: 'Premium Selection', d: 'Hand-picked fabric from trusted mills.' },
                { icon: ShieldCheck, t: 'Honest Pricing', d: 'No middlemen, straight wholesale rates.' },
                { icon: Truck, t: 'Fast Dispatch', d: 'Pan-India delivery within days.' },
                { icon: Users, t: 'Retailer First', d: 'Built for shop owners, by shop owners.' },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-cream-100/60 border border-stone-200/70">
                  <div className="w-10 h-10 rounded-xl bg-white text-brand-700 grid place-items-center flex-shrink-0 border border-stone-200"><x.icon size={18}/></div>
                  <div>
                    <div className="font-semibold text-stone-900">{x.t}</div>
                    <div className="text-sm text-stone-600 mt-0.5">{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Card */}
          <aside className="bg-white rounded-3xl p-7 shadow-soft border border-stone-100 h-fit md:sticky md:top-28">
            <div className="font-display text-2xl font-semibold text-stone-900">Contact Us</div>
            <div className="mt-5 space-y-4 text-sm">
              {s?.phone && <a href={`tel:${s.phone}`} className="flex items-start gap-3 text-stone-700 hover:text-stone-900"><div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><Phone size={16}/></div><div><div className="text-xs text-stone-500">Call</div><div className="font-semibold">{s.phone}</div></div></a>}
              {s?.email && <a href={`mailto:${s.email}`} className="flex items-start gap-3 text-stone-700 hover:text-stone-900"><div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><Mail size={16}/></div><div><div className="text-xs text-stone-500">Email</div><div className="font-semibold">{s.email}</div></div></a>}
              {s?.address && (
                <a href={s.google_maps_url || '#'} target={s.google_maps_url ? '_blank' : undefined} rel="noreferrer" className="flex items-start gap-3 text-stone-700 hover:text-stone-900">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><MapPin size={16}/></div>
                  <div>
                    <div className="text-xs text-stone-500">Address {s.google_maps_url && <span className="text-brand-700">· View on map</span>}</div>
                    <div className="font-semibold">{s.address}</div>
                  </div>
                </a>
              )}
              {s?.business_hours && (
                <div className="flex items-start gap-3 text-stone-700">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0"><Clock size={16}/></div>
                  <div><div className="text-xs text-stone-500">Hours</div><div className="font-semibold">{s.business_hours}</div></div>
                </div>
              )}
            </div>
            <a href={whatsappLink(s?.whatsapp)} target="_blank" rel="noreferrer" className="mt-6 pub-btn-whatsapp w-full !py-3"><WhatsAppIcon className="w-5 h-5"/> Chat on WhatsApp</a>
          </aside>
        </div>
      </section>

      <TestimonialsSection />
    </>
  );
}
