import { useState, useEffect } from 'react';
import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';
import { MessageCircle, Instagram, Facebook, Phone, X } from 'lucide-react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function WhatsAppFab() {
  const { data: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function trackClick(platform: string) {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'contact_click', {
        event_category: 'engagement',
        event_label: `FAB ${platform}`,
      });
    }
  }

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  if (!settings) return null;

  // Check if at least one contact channel exists
  const hasContact = settings.whatsapp || settings.instagram_url || settings.facebook_url || settings.phone;
  if (!hasContact) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end"
      onClick={(e) => e.stopPropagation()} // Prevent immediate closing when clicking inside
    >
      {/* Floating Menu Stack */}
      <div
        className={`flex flex-col gap-3 mb-3 items-end transition-all duration-300 origin-bottom ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* WhatsApp Option */}
        {settings.whatsapp && (
          <div className="flex items-center gap-2">
            <span className="bg-stone-900/90 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg shadow-stone-900/10 whitespace-nowrap">
              WhatsApp
            </span>
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on WhatsApp"
              onClick={() => trackClick('WhatsApp')}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200"
            >
              <WhatsAppIcon className="w-6 h-6" />
            </a>
          </div>
        )}

        {/* Instagram Option */}
        {settings.instagram_url && (
          <div className="flex items-center gap-2">
            <span className="bg-stone-900/90 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg shadow-stone-900/10 whitespace-nowrap">
              Instagram
            </span>
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Profile"
              onClick={() => trackClick('Instagram')}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#f9ce71] via-[#e85a4f] to-[#b32b8e] text-white shadow-lg hover:scale-110 transition-transform duration-200"
            >
              <Instagram className="w-5.5 h-5.5" />
            </a>
          </div>
        )}

        {/* Facebook Option */}
        {settings.facebook_url && (
          <div className="flex items-center gap-2">
            <span className="bg-stone-900/90 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg shadow-stone-900/10 whitespace-nowrap">
              Facebook
            </span>
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook Page"
              onClick={() => trackClick('Facebook')}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1877F2] text-white shadow-lg hover:scale-110 transition-transform duration-200"
            >
              <Facebook className="w-5.5 h-5.5" />
            </a>
          </div>
        )}

        {/* Phone Option */}
        {settings.phone && (
          <div className="flex items-center gap-2">
            <span className="bg-stone-900/90 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg shadow-stone-900/10 whitespace-nowrap">
              Call Us
            </span>
            <a
              href={`tel:${settings.phone}`}
              aria-label="Call Business"
              onClick={() => trackClick('Call')}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 text-white shadow-lg hover:scale-110 transition-transform duration-200"
            >
              <Phone className="w-5.5 h-5.5" />
            </a>
          </div>
        )}
      </div>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle contact menu"
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 ${
          isOpen 
            ? 'bg-stone-850 shadow-stone-850/20' 
            : 'bg-brand-600 shadow-brand-600/30 hover:shadow-brand-600/40'
        }`}
      >
        {/* Pulsing effect when closed */}
        {!isOpen && mounted && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-600 opacity-75 animate-ping -z-10" />
        )}
        
        {isOpen ? (
          <X className="w-6 h-6 transition-all duration-300 rotate-90" />
        ) : (
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
