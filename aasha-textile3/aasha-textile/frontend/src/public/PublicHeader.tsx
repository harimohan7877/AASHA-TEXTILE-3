import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useSettings, useCategories, useProducts, whatsappLink, useCart, slugify } from './usePublicData';
import { resolveImage } from '../lib/api';

export default function PublicHeader() {
  const { data: settings } = useSettings();
  const { data: cats } = useCategories();
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // ✅ Search Autocomplete
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults } = useProducts(searchQuery.length >= 2 ? { q: searchQuery, limit: 8 } : undefined);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const storeName = settings?.store_name || 'Aasha Textile';

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? 'bg-cream-50/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="pub-container flex items-center justify-between h-16 sm:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-brand-500 to-brand-800 grid place-items-center text-white font-bold shadow-md">
            {settings?.logo_url ? (
              <img src={resolveImage(settings.logo_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-xl">A</span>
            )}
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg sm:text-xl font-semibold text-stone-900">{storeName}</div>
            <div className="text-[10px] sm:text-[11px] tracking-widest uppercase text-stone-500 -mt-0.5">Premium Fabric</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink to="/" end className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}>Home</NavLink>

          <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <a href="/#collection" onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} className={`text-sm font-medium transition-colors ${catOpen ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}>Categories</a>
            {catOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                <div className="bg-white rounded-2xl shadow-soft border border-stone-100 p-2 min-w-[220px] animate-fadeIn">
                  {(cats || []).filter(c => (c.product_count || 0) > 0).map((c) => (
                    <Link key={c.name} to={`/category/${encodeURIComponent(c.slug || slugify(c.name))}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cream-100 text-sm text-stone-700">
                      <span>{c.name}</span>
                      <span className="text-xs text-stone-400">{c.product_count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NavLink to="/about" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}>About</NavLink>
          <a href={`tel:${settings?.phone || ''}`} className="text-sm font-medium text-stone-600 hover:text-stone-900">Contact</a>
        </nav>

        {/* Desktop CTA */}
        {/* ✅ Search with Autocomplete */}
        <div ref={searchRef} className="relative hidden lg:block mr-1">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:border-stone-400 transition">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="bg-transparent border-none outline-none w-20 placeholder:text-stone-400"
              />
            </div>
          </form>
          {/* Autocomplete Dropdown */}
          {searchOpen && searchResults && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden z-50">
              {searchResults.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-cream-50 border-b border-stone-50 last:border-0"
                >
                  {p.image_url && <img src={resolveImage(p.image_url)} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-900 truncate">{p.name}</div>
                    <div className="text-xs text-stone-500">{p.category} {p.rate && `• ${p.rate}`}</div>
                  </div>
                </Link>
              ))}
              <Link
                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => { setSearchOpen(false); }}
                className="block px-3 py-2 text-center text-sm text-brand-600 hover:bg-cream-50 font-medium"
              >
                View all results →
              </Link>
            </div>
          )}
        </div>
        {/* Cart icon */}
        <Link to="/cart" className="relative hidden lg:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-stone-100 transition">
          <ShoppingCart size={20} className="text-stone-700"/>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full grid place-items-center">{totalItems}</span>
          )}
        </Link>
        <div className="hidden lg:flex items-center gap-3">
          <a href={`tel:${settings?.phone || ''}`} className="pub-btn-outline !py-2 !px-4 !text-sm">
            <Phone size={14}/> Call
          </a>
          <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp !py-2 !px-4 !text-sm">
            <WhatsAppIcon className="w-4 h-4"/> WhatsApp
          </a>
        </div>

        {/* Mobile button */}
        <button onClick={() => setOpen(true)} className="lg:hidden p-2 -mr-2 rounded-lg text-stone-900 hover:bg-stone-900/5" aria-label="Open menu">
          <Menu size={22}/>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-cream-50 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200">
              <span className="font-display text-lg font-semibold">{storeName}</span>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-stone-200/70"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-1">
              {/* ✅ Mobile Search Input */}
              <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem('mobile-search') as HTMLInputElement)?.value?.trim(); if(q) { navigate(`/search?q=${encodeURIComponent(q)}`); setOpen(false); }}} className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                <input name="mobile-search" type="search" placeholder="Search fabrics..." autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
              </form>
              <Link to="/" onClick={() => setOpen(false)} className="block px-3 py-3 rounded-lg hover:bg-stone-200/50 font-medium">Home</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-stone-200/50 font-medium">
                <span>🛒 Cart</span>
                {totalItems > 0 && <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>}
              </Link>
              <Link to="/about" onClick={() => setOpen(false)} className="block px-3 py-3 rounded-lg hover:bg-stone-200/50 font-medium">About</Link>
              <div className="px-3 py-2 text-xs font-semibold tracking-widest uppercase text-stone-500 mt-3">Shop by Category</div>
              {(cats || []).filter(c => (c.product_count || 0) > 0).map((c) => (
                <Link key={c.name} to={`/category/${encodeURIComponent(c.slug || slugify(c.name))}`} onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-stone-200/50">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-stone-400">{c.product_count}</span>
                </Link>
              ))}
            </div>
            <div className="mt-auto p-5 border-t border-stone-200 space-y-2">
              <a href={`tel:${settings?.phone || ''}`} className="pub-btn-outline w-full !py-3"><Phone size={16}/> Call Now</a>
              <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="pub-btn-whatsapp w-full !py-3"><WhatsAppIcon className="w-5 h-5"/> WhatsApp Us</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
