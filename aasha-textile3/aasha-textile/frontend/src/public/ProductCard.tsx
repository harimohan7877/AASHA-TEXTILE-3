import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { resolveImage } from '../lib/api';
import type { Product } from './usePublicData';

export default function ProductCard({ p }: { p: Product }) {
  const out = p.stock_status === 'out_of_stock';
  return (
    <Link to={`/product/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream-100 ring-1 ring-stone-900/5 shadow-sm group-hover:shadow-soft transition-shadow">
        {p.image_url ? (
          <img src={resolveImage(p.image_url)} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center text-stone-300 font-display text-3xl">A</div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.is_featured && (
            <span className="inline-flex items-center gap-1 bg-stone-900 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full"><Star size={10} fill="currentColor"/> Bestseller</span>
          )}
          {out && (
            <span className="inline-flex items-center bg-red-600/95 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full">Out of Stock</span>
          )}
        </div>
      </div>
      <div className="mt-3 sm:mt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-stone-900 truncate">{p.name}</div>
            {p.name_en && <div className="text-xs text-stone-500 truncate">{p.name_en}</div>}
          </div>
          {p.rate && <div className="text-sm font-semibold text-brand-700 whitespace-nowrap">{p.rate}</div>}
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
