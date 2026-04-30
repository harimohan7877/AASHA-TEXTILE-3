import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import WhatsAppFab from './WhatsAppFab';

export default function PublicLayout() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [loc.pathname]);
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1"><Outlet /></main>
      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
}
