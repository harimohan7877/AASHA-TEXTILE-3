import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const faqs = [
  {
    q: "How do I place a wholesale order?",
    a: "Simply browse our products, add items to cart, and click 'Order on WhatsApp'. We'll confirm availability and pricing within hours."
  },
  {
    q: "What is the minimum order quantity?",
    a: "Minimum order varies by product. For most fabrics, it's 50 meters. For readymade items, it's 10 pieces. Contact us for specific product requirements."
  },
  {
    q: "Do you offer GST invoice?",
    a: "Yes! All wholesale orders come with proper GST invoice. Just share your business GST details during order confirmation."
  },
  {
    q: "How long does delivery take?",
    a: "We dispatch within 2-3 business days. Delivery time depends on your location - typically 3-7 days for most cities in India."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, Google Pay, PhonePe, Paytm, Bank Transfer (NEFT/IMPS), and Cash on Delivery for trusted customers."
  },
  {
    q: "Can I return or exchange products?",
    a: "Yes, we offer 7-day replacement for manufacturing defects. Product must be unused and in original packaging. Contact us before returning."
  },
  {
    q: "Do you ship pan-India?",
    a: "Yes! We ship across India through trusted courier partners. Shipping costs are additional and based on weight/destination."
  },
  {
    q: "How can I track my order?",
    a: "Once dispatched, we'll share tracking number via WhatsApp. You can track your order on the courier's website."
  },
  {
    q: "Can I get fabric samples before bulk order?",
    a: "Yes, we can send samples (charges apply). Contact us via WhatsApp to request fabric samples."
  },
  {
    q: "How do I contact you for bulk inquiries?",
    a: "Best way is WhatsApp! Click the WhatsApp button at bottom right. We're available during business hours: Mon-Sat, 10AM-8PM."
  }
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="pub-container max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-6">
          <ArrowLeft size={14}/> Back to Home
        </Link>

        <div className="text-center mb-10">
          <span className="pub-eyebrow">Help</span>
          <h1 className="pub-heading mt-3">Frequently Asked Questions</h1>
          <p className="mt-3 text-stone-600">Got questions? We've got answers.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-stone-50 transition"
              >
                <span className="font-semibold text-stone-900 pr-4">{faq.q}</span>
                {openIdx === i ? <ChevronUp size={20} className="text-stone-400 flex-shrink-0"/> : <ChevronDown size={20} className="text-stone-400 flex-shrink-0"/>}
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 text-stone-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-cream-100 rounded-2xl p-8 text-center">
          <MessageCircle size={32} className="mx-auto text-brand-700 mb-3"/>
          <h3 className="font-display text-xl font-semibold text-stone-900">Still have questions?</h3>
          <p className="mt-2 text-stone-600">We're here to help! Send us a message on WhatsApp.</p>
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="pub-btn-whatsapp inline-flex mt-5">
            <MessageCircle size={18}/> Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}