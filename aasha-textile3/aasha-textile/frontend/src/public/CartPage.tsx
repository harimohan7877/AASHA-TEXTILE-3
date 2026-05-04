import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart, useSettings, whatsappLink } from './usePublicData';
import { resolveImage } from '../lib/api';
import { WhatsAppIcon } from './PublicHeader';
import { useEffect } from 'react';

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, totalItems } = useCart();
  const settings = useSettings();

  useEffect(() => { document.title = `Cart (${totalItems}) — Aasha Textile`; }, [totalItems]);

  const whatsappOrder = () => {
    if (items.length === 0) return '#';
    const lines = items.map(i => `• ${i.name}${i.name_en ? ` (${i.name_en})` : ''} × ${i.qty}${i.rate ? ` — ${i.rate}` : ''}`).join('\n');
    const msg = `Hi, main yeh order karna chahta/chahti hoon:\n\n${lines}\n\nKya yeh available hai? Please confirm karein.`;
    return whatsappLink(settings?.whatsapp, msg);
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="pub-container text-center py-20">
          <ShoppingCart size={48} className="mx-auto text-stone-300 mb-4"/>
          <h1 className="pub-heading !text-3xl">Cart Khaali Hai</h1>
          <p className="mt-3 text-stone-500">Koi product add nahi kiya abhi tak.</p>
          <Link to="/" className="pub-btn-primary mt-6 inline-flex">Products Dekhein</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="pub-container max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-6">
          <ArrowLeft size={14}/> Shopping Jaari Rakho
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Mera Cart ({totalItems})</h1>
          <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Sab Hatao
          </button>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-8">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-4">
              {/* Image */}
              <Link to={`/product/${item.id}`} className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100">
                  {item.image_url ? (
                    <img src={resolveImage(item.image_url)} alt={item.name} className="w-full h-full object-cover"/>
                  ) : <div className="w-full h-full grid place-items-center text-stone-300 font-display text-2xl">A</div>}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`}>
                  <div className="font-semibold text-stone-900 truncate">{item.name}</div>
                  {item.name_en && <div className="text-xs text-stone-500 truncate">{item.name_en}</div>}
                </Link>
                {item.rate && <div className="text-sm font-semibold text-brand-700 mt-1">{item.rate}</div>}
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => updateQty(item.id, item.qty - 1)}
                  className="w-8 h-8 rounded-full border border-stone-200 grid place-items-center hover:bg-stone-100">
                  <Minus size={14}/>
                </button>
                <span className="w-8 text-center font-semibold text-stone-900">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)}
                  className="w-8 h-8 rounded-full border border-stone-200 grid place-items-center hover:bg-stone-100">
                  <Plus size={14}/>
                </button>
              </div>

              {/* Remove */}
              <button onClick={() => removeFromCart(item.id)} className="text-stone-400 hover:text-red-500 transition flex-shrink-0">
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>

        {/* WhatsApp Order */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-1">Order karna hai?</h3>
          <p className="text-sm text-stone-500 mb-4">WhatsApp pe message jayega — {settings?.store_name || 'Aasha Textile'} confirm karega.</p>
          <a href={whatsappOrder()} target="_blank" rel="noreferrer"
            className="pub-btn-whatsapp w-full justify-center !py-4 !text-base">
            <WhatsAppIcon className="w-5 h-5"/>
            WhatsApp pe Order Karo ({totalItems} items)
          </a>
        </div>
      </div>
    </div>
  );
}
