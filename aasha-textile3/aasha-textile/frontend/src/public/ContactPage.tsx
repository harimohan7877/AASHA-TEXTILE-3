import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, Loader2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useSettings, whatsappLink } from './usePublicData';
import { WhatsAppIcon } from './PublicHeader';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { data: settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name aur message zaroori hain');
      return;
    }
    setSending(true);
    // Simulate sending - in real scenario, save to backend
    setTimeout(() => {
      toast.success('Message bhej diya! WhatsApp pe jald reply aayega.');
      setForm({ name: '', email: '', phone: '', message: '' });
      setSending(false);
    }, 1000);
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="pub-container">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-6">
          <ArrowLeft size={14}/> Back to Home
        </Link>

        <div className="text-center mb-10">
          <span className="pub-eyebrow">Get in Touch</span>
          <h1 className="pub-heading mt-3">Contact Us</h1>
          <p className="mt-3 text-stone-600">We'd love to hear from you. Reach out anytime!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">Contact Information</h2>
              <div className="space-y-4">
                {settings?.phone && (
                  <a href={`tel:${settings.phone}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-cream-50 transition">
                    <div className="w-12 h-12 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0">
                      <Phone size={20}/>
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 uppercase tracking-wider">Phone</div>
                      <div className="font-semibold text-stone-900">{settings.phone}</div>
                    </div>
                  </a>
                )}
                {settings?.email && (
                  <a href={`mailto:${settings.email}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-cream-50 transition">
                    <div className="w-12 h-12 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0">
                      <Mail size={20}/>
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 uppercase tracking-wider">Email</div>
                      <div className="font-semibold text-stone-900">{settings.email}</div>
                    </div>
                  </a>
                )}
                {settings?.address && (
                  <a href={settings.google_maps_url || '#'} target={settings.google_maps_url ? '_blank' : undefined} rel="noreferrer" className="flex items-start gap-4 p-3 rounded-xl hover:bg-cream-50 transition">
                    <div className="w-12 h-12 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0">
                      <MapPin size={20}/>
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 uppercase tracking-wider">Address</div>
                      <div className="font-semibold text-stone-900">{settings.address}</div>
                      {settings.google_maps_url && <div className="text-xs text-brand-700 mt-0.5">View on Map →</div>}
                    </div>
                  </a>
                )}
                {settings?.business_hours && (
                  <div className="flex items-start gap-4 p-3 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-cream-100 text-brand-700 grid place-items-center flex-shrink-0">
                      <Clock size={20}/>
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 uppercase tracking-wider">Business Hours</div>
                      <div className="font-semibold text-stone-900">{settings.business_hours}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <WhatsAppIcon className="w-8 h-8"/>
                <div>
                  <div className="font-display text-xl font-semibold">Prefer WhatsApp?</div>
                  <div className="text-white/80 text-sm">Quick responses, directly on WhatsApp</div>
                </div>
              </div>
              <a href={whatsappLink(settings?.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-[#128C7E] px-5 py-2.5 rounded-xl font-semibold hover:bg-cream-100 transition">
                <MessageCircle size={18}/>
                Start Chat
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Your Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="input" placeholder="Aapka naam"/>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email (Optional)</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="input" placeholder="email@example.com"/>
                </div>
                <div>
                  <label className="label">Phone (Optional)</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="input" placeholder="+91 98765 43210"/>
                </div>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="input resize-none" placeholder="Aapko kaise madad kar sakte hain?"/>
              </div>
              <button type="submit" disabled={sending} className="pub-btn-primary w-full justify-center !py-3">
                {sending ? <><Loader2 size={18} className="animate-spin"/> Sending...</> : <><Send size={18}/> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}