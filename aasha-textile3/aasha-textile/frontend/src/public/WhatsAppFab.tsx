import { useState, useEffect } from 'react';
import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppFab() {
  const { data: settings } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!settings?.whatsapp) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
      {/* Tooltip */}
      {mounted && showTooltip && (
        <div className="absolute bottom-full right-0 mb-3 bg-stone-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap animate-fadeIn">
          Chat with us
          <div className="absolute bottom-0 right-4 -mb-1 w-2 h-2 bg-stone-900 rotate-45"/>
        </div>
      )}
      <a
        href={whatsappLink(settings.whatsapp)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 hover:scale-110 transition-all duration-300"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping -z-10"/>
        <WhatsAppIcon className="w-7 h-7 group-hover:scale-110 transition-transform"/>
      </a>
    </div>
  );
}
