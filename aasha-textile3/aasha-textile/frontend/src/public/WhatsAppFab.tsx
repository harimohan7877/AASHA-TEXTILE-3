import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';

export default function WhatsAppFab() {
  const settings = useSettings();
  if (!settings?.whatsapp) return null;
  return (
    <a
      href={whatsappLink(settings.whatsapp)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-lg shadow-emerald-600/40 hover:scale-105 transition-transform"
    >
      <WhatsAppIcon className="w-7 h-7"/>
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping -z-10"/>
    </a>
  );
}
