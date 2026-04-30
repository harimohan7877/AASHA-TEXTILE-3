import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileText, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';

const META: Record<string, { title: string; field: string; icon: any; eyebrow: string; fallback: string }> = {
  shipping: {
    title: 'Shipping & Delivery',
    field: 'shipping_info',
    icon: Truck,
    eyebrow: 'Policy',
    fallback: 'We ship pan-India via trusted courier partners. Order tracking is shared on WhatsApp once your package is dispatched.',
  },
  returns: {
    title: 'Return & Replacement',
    field: 'return_policy',
    icon: RotateCcw,
    eyebrow: 'Policy',
    fallback: '7-day replacement for any manufacturing defect. Product must be unused and in original packaging.',
  },
  privacy: {
    title: 'Privacy Policy',
    field: 'privacy_policy',
    icon: ShieldCheck,
    eyebrow: 'Policy',
    fallback: 'We respect your privacy. Your contact details are used only to respond to enquiries and never shared with third parties.',
  },
};

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const settings = useSettings();
  const meta = slug ? META[slug] : undefined;

  if (!meta) return <Navigate to="/" replace />;

  const text: string = (settings?.[meta.field as keyof typeof settings] as string) || meta.fallback;
  const Icon = meta.icon;

  return (
    <>
      <section className="pt-28 pb-10 bg-gradient-to-b from-cream-100 to-cream-50 border-b border-stone-200/60">
        <div className="pub-container max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-4"><ArrowLeft size={14}/> Back to Home</Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-brand-700 grid place-items-center border border-stone-200 shadow-sm"><Icon size={20}/></div>
            <div>
              <span className="pub-eyebrow">{meta.eyebrow}</span>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-1 text-stone-900">{meta.title}</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container max-w-3xl">
          <div className="bg-white rounded-3xl shadow-soft border border-stone-100 p-7 sm:p-10">
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-line">
              {text}
            </div>
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center gap-3">
              <FileText size={16} className="text-stone-400"/>
              <p className="text-sm text-stone-500 flex-1">Have questions about this policy?</p>
              <a href={whatsappLink(settings?.whatsapp, `Hi, I have a question about your ${meta.title} policy.`)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp !py-2 !px-4 text-sm">
                <WhatsAppIcon className="w-4 h-4"/> Ask on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {Object.entries(META).filter(([k]) => k !== slug).map(([k, m]) => {
              const I = m.icon;
              return (
                <Link key={k} to={`/policies/${k}`} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-200/60 hover:border-stone-300 hover:shadow-soft transition" data-testid={`policy-link-${k}`}>
                  <div className="w-9 h-9 rounded-lg bg-cream-100 text-brand-700 grid place-items-center"><I size={16}/></div>
                  <div className="text-sm font-semibold text-stone-900">{m.title}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
