import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { useProducts, useCategories, slugify } from './usePublicData';
import ProductCard from './ProductCard';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const products = useProducts(q ? { q, limit: 100 } : { limit: 0 });
  const cats = useCategories();

  useEffect(() => {
    document.title = q ? `"${q}" — Aasha Textile` : 'Search — Aasha Textile';
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  }

  const matchedCats = (cats || []).filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) && (c.product_count || 0) > 0
  );

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="pub-container">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-6">
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              autoFocus
              className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search fabric, category, variety..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <button type="submit" className="pub-btn-primary !rounded-xl !px-6">Search</button>
        </form>

        {/* Matched categories */}
        {q && matchedCats.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {matchedCats.map(c => (
                <Link key={c.name} to={`/category/${encodeURIComponent(c.slug || slugify(c.name))}`}
                  className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100">
                  {c.name} ({c.product_count})
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!q ? (
          <div className="py-20 text-center text-stone-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>Kya dhundh rahe ho? Upar type karo.</p>
          </div>
        ) : !products ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-stone-100 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Search size={32} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-600 font-medium">"{q}" ke liye koi product nahi mila</p>
            <p className="text-sm text-stone-400 mt-1">Doosra keyword try karo</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">{products.length} products mile "{q}" ke liye</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
