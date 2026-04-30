import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, BadgeCheck } from 'lucide-react';
import { useSettings, useCategories, whatsappLink, slugify } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';

export default function PublicFooter() {
  const settings = useSettings();
  const cats = useCategories();
  const year = new Date().getFullYear();

  const socials = [
    settings?.instagram_url && { href: settings.instagram_url, icon: Instagram, label: 'Instagram' },
    settings?.facebook_url && { href: settings.facebook_url, icon: Facebook, label: 'Facebook' },
    settings?.youtube_url && { href: settings.youtube_url, icon: Youtube, label: 'YouTube' },
  ].filter(Boolean) as Array<{ href: string; icon: any; label: string }>;

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="pub-container py-14 sm:py-16 grid gap-10 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <div className="font-display text-2xl font-semibold text-white">{settings?.store_name || 'Aasha Textile'}</div>
          {settings?.tagline && <div className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-300">{settings.tagline}</div>}
          <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-sm">
            {settings?.about || 'A trusted wholesale textile shop offering premium quality fabrics at best prices.'}
          </p>

          {/* Trust badges */}
          {(settings?.gst_number || settings?.udyam_number || settings?.established_year) && (
            <div className="mt-5 flex flex-wrap gap-2" data-testid="footer-trust-badges">
              {settings?.gst_number && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1.5 rounded-full">
                  <BadgeCheck size={13}/> GST: <span className="font-mono">{settings.gst_number}</span>
                </span>
              )}
              {settings?.udyam_number && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1.5 rounded-full">
                  <BadgeCheck size={13}/> MSME: <span className="font-mono">{settings.udyam_number}</span>
                </span>
              )}
              {settings?.established_year && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/5 text-stone-300 border border-white/10 px-2.5 py-1.5 rounded-full">
                  Since {settings.established_year}
                </span>
              )}
            </div>
          )}

          {/* Socials */}
          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-stone-300 hover:text-white transition"
                  data-testid={`social-${s.label.toLowerCase()}`}>
                  <s.icon size={15}/>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="md:col-span-3">
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <div className="space-y-2.5 text-sm">
            {settings?.address && (
              <a href={settings.google_maps_url || '#'} target={settings.google_maps_url ? '_blank' : undefined} rel="noreferrer" className="flex items-start gap-2.5 hover:text-white">
                <MapPin size={15} className="mt-0.5 text-brand-400 flex-shrink-0"/><span>{settings.address}</span>
              </a>
            )}
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 hover:text-white"><Phone size={15} className="text-brand-400"/>{settings.phone}</a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-white"><Mail size={15} className="text-brand-400"/>{settings.email}</a>
            )}
            {settings?.business_hours && (
              <div className="flex items-start gap-2.5"><Clock size={15} className="mt-0.5 text-brand-400 flex-shrink-0"/><span>{settings.business_hours}</span></div>
            )}
            <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 mt-1">
              <WhatsAppIcon className="w-3.5 h-3.5"/> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Categories */}
        <div className="md:col-span-2">
          <h4 className="text-white font-semibold mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            {(cats || []).filter(c => (c.product_count || 0) > 0).slice(0,8).map((c) => (
              <li key={c.name}>
                <Link to={`/category/${encodeURIComponent(c.slug || slugify(c.name))}`} className="hover:text-white">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div className="md:col-span-2">
          <h4 className="text-white font-semibold mb-4">Information</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/policies/shipping" className="hover:text-white">Shipping Info</Link></li>
            <li><Link to="/policies/returns" className="hover:text-white">Return Policy</Link></li>
            <li><Link to="/policies/privacy" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Payments strip */}
      {settings?.payment_methods && (
        <div className="border-t border-stone-800/80 bg-stone-950/60">
          <div className="pub-container py-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-stone-500">
            <span className="font-semibold text-stone-400 uppercase tracking-wider">Payments Accepted</span>
            <span className="text-stone-400 text-center sm:text-left">{settings.payment_methods}</span>
          </div>
        </div>
      )}

      <div className="border-t border-stone-800">
        <div className="pub-container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div>© {year} {settings?.store_name || 'Aasha Textile'}. All rights reserved.</div>
          <div>Crafted with care — Premium Fabric{settings?.owner_name ? ` · ${settings.owner_name}` : ''}</div>
        </div>
      </div>
    </footer>
  );
}
