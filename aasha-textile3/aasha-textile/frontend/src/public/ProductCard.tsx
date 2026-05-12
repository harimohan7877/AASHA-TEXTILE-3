import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { resolveImage } from '../lib/api';
import type { Product } from './usePublicData';
import LazyImage from '../components/LazyImage';
import { useCart } from './usePublicData';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProductCard({ p }: { p: Product }) {
  const out = p.stock_status === 'out_of_stock';
  const { addToCart } = useCart();
  const [imgLoaded, setImgLoaded] = useState(false);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    addToCart(p);
    toast.success(`${p.name} cart mein add ho gaya!`);
  }

  return (
    <Link to={`/product/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream-100 ring-1 ring-stone-900/5 shadow-sm group-hover:shadow-soft transition-all duration-300">
        {p.image_url ? (
          <>
            <LazyImage src={resolveImage(p.image_url)} alt={p.name} className={`group-hover:scale-[1.04] transition-transform duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setImgLoaded(true)} />
            {!imgLoaded && <div className="absolute inset-0 bg-cream-100 animate-pulse" />}
          </>
        ) : (
          <div className="w-full h-full grid place-items-center text-stone-300 font-display text-3xl">A</div>
        )}
        {/* Quick action buttons on hover */}
        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-300" />
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button onClick={handleQuickAdd} disabled={out} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition ${out ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-white text-stone-900 hover:bg-brand-50 hover:text-brand-700 shadow-lg'}`}>
            <ShoppingCart size={16}/> Add
          </button>
          <Link to={`/product/${p.id}`} onClick={e => e.stopPropagation()} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-stone-700 hover:bg-brand-50 hover:text-brand-700 shadow-lg transition">
            <Eye size={16}/>
          </Link>
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.is_featured && (
            <span className="inline-flex items-center gap-1 bg-stone-900 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full shadow-md"><Star size={10} fill="currentColor"/> Bestseller</span>
          )}
          {out && (
            <span className="inline-flex items-center bg-red-600/95 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full shadow-md">Out of Stock</span>
          )}
        </div>
        {/* Wishlist heart */}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success('Wishlist mein add ho gaya!'); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:text-red-500">
          <Heart size={14} className="text-stone-600 hover:text-red-500"/>
        </button>
      </div>
      <div className="mt-3 sm:mt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-stone-900 truncate group-hover:text-brand-700 transition-colors">{p.name}</div>
            {p.name_en && <div className="text-xs text-stone-500 truncate">{p.name_en}</div>}
          </div>
          {p.rate && <div className="text-sm font-bold text-brand-700 whitespace-nowrap bg-brand-50 px-2 py-0.5 rounded-md">{p.rate}</div>}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-500">
          <span className="inline-block w-1 h-1 rounded-full bg-stone-400"/>
          <span>{p.category}</span>
          {p.variety && (<><span className="inline-block w-1 h-1 rounded-full bg-stone-400"/><span>{p.variety}</span></>)}
        </div>
      </div>
    </Link>
  );
}
