import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import WhatsAppFab from './WhatsAppFab';

export default function PublicLayout() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [loc.pathname]);

  // ✅ JSON-LD Organization schema for SEO
  useEffect(() => {
    const orgJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Aasha Textile",
      "url": "https://aashatextile.com",
      "logo": "https://aashatextile.com/favicon.svg",
      "description": "Premium wholesale textile shop in Surat — Cotton, Rayon, Silk fabrics at best prices",
      "areaServed": "India",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Hindi"]
      }
    };
    const existing = document.getElementById('org-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'org-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(orgJsonLd);
    document.head.appendChild(script);
    return () => { document.getElementById('org-jsonld')?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1"><Outlet /></main>
      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
}
