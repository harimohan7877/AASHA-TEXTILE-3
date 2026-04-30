import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { useCategories, useProducts, slugify } from './usePublicData';
import ProductCard from './ProductCard';
import { resolveImage } from '../lib/api';
import { useMemo, useState } from 'react';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const cats = useCategories();
  const decodedSlug = decodeURIComponent(slug || '');

  const current = useMemo(() => {
    if (!cats) return null;
    return cats.find(c => (c.slug || slugify(c.name)) === decodedSlug) ||
           cats.find(c => c.name.toLowerCase() === decodedSlug.toLowerCase()) || null;
  }, [cats, decodedSlug]);

  const products = useProducts(current ? { category: current.name, limit: 500 } : { limit: 0 });

  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const sorted = useMemo(() => {
    if (!products) return null;
    let list = [...products];
    if (featuredOnly) list = list.filter(p => p.is_featured);
    const num = (s?: string) => parseInt((s || '').replace(/[^0-9]/g, '') || '0', 10);
    if (sort === 'price_asc') list.sort((a, b) => num(a.rate) - num(b.rate));
    else if (sort === 'price_desc') list.sort((a, b) => num(b.rate) - num(a.rate));
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort, featuredOnly]);

  const heroImg = current?.image_url ? resolveImage(current.image_url) : (products?.[0]?.image_url ? resolveImage(products[0].image_url) : '');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-10 sm:pb-14">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-100 to-cream-50"/>
        {heroImg && (
          <div className="absolute inset-0 opacity-[0.18]">
            <img src={heroImg} alt="" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-50/40 to-cream-50"/>
          </div>
        )}
        <div className="relative pub-container">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-6">
            <ArrowLeft size={14}/> Back to Home
          </Link>
          <span className="pub-eyebrow">Collection</span>
          <h1 className="pub-heading mt-3">{current?.name || decodedSlug}</h1>
          {current?.description && <p className="mt-3 text-stone-600 max-w-2xl">{current.description}</p>}
          <div className="mt-4 text-sm text-stone-500">{sorted?.length ?? 0} products</div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 sm:top-20 z-30 bg-cream-50/90 backdrop-blur border-y border-stone-200/60">
        <div className="pub-container py-3 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} className="w-4 h-4 accent-stone-900"/>
            <span className="text-stone-700">Bestsellers only</span>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Filter size={14} className="text-stone-500"/>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-transparent text-stone-700 focus:outline-none">
              <option value="default">Sort: Default</option>
              <option value="name">Name (A–Z)</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="pub-section !pt-10">
        <div className="pub-container">
          {!sorted ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({length: 8}).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 animate-pulse"/>)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex mx-auto w-14 h-14 rounded-full bg-cream-100 text-stone-400 grid place-items-center"><Filter size={20}/></div>
              <div className="mt-4 font-display text-2xl text-stone-900">No products match</div>
              <p className="mt-1 text-stone-500">Try removing filters or explore other categories.</p>
              <Link to="/" className="mt-6 inline-flex pub-btn-primary">Back to Home</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sorted.map((p) => <ProductCard key={p.id} p={p}/>)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
