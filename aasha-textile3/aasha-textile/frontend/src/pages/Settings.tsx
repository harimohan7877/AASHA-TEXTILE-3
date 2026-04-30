import { useEffect, useState } from 'react';
import { api, resolveImage } from '../lib/api';
import { Loader2, Save, Upload, KeyRound, ImageIcon, Info, Building2, Share2, FileText, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'hero' | null>(null);

  const FIELDS = [
    'store_name','tagline','whatsapp','phone','address','email','about','logo_url','hero_image_url',
    'gst_number','udyam_number','established_year','owner_name','business_hours',
    'happy_customers','years_of_trust',
    'instagram_url','facebook_url','youtube_url','google_maps_url',
    'payment_methods','shipping_info','return_policy','privacy_policy',
  ];

  useEffect(() => {
    api.get('/settings').then((r) => setS(r.data || {})).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const payload: any = {};
      FIELDS.forEach((k) => { if (s[k] !== undefined) payload[k] = s[k]; });
      const { data } = await api.patch('/settings', payload);
      setS(data);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  async function upload(file: File, field: 'logo_url' | 'hero_image_url') {
    setUploading(field === 'logo_url' ? 'logo' : 'hero');
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setS({ ...s, [field]: data.url });
      toast.success('Image uploaded — remember to Save');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally { setUploading(null); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', pw);
      toast.success('Password changed successfully');
      setPw({ current_password: '', new_password: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    } finally { setSavingPw(false); }
  }

  const setField = (k: string, v: any) => setS({ ...s, [k]: v });

  if (loading || !s) return <div className="py-16 grid place-items-center"><Loader2 className="animate-spin text-brand-600" size={24}/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Store info, trust credentials, policies and admin account</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="animate-spin" size={14}/> Saving...</> : <><Save size={14}/> Save All Changes</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* STORE INFO */}
          <Section icon={Info} title="Store Information" desc="Shown everywhere on the public website">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Store Name"><input className="input" value={s.store_name || ''} onChange={(e) => setField('store_name', e.target.value)}/></Field>
              <Field label="Tagline"><input className="input" value={s.tagline || ''} onChange={(e) => setField('tagline', e.target.value)}/></Field>
              <Field label="WhatsApp Number (with country code)"><input className="input" value={s.whatsapp || ''} placeholder="+91..." onChange={(e) => setField('whatsapp', e.target.value)}/></Field>
              <Field label="Phone"><input className="input" value={s.phone || ''} onChange={(e) => setField('phone', e.target.value)}/></Field>
              <Field label="Email"><input className="input" value={s.email || ''} onChange={(e) => setField('email', e.target.value)}/></Field>
              <Field label="Business Hours"><input className="input" value={s.business_hours || ''} placeholder="Mon – Sat: 10 AM – 8 PM" onChange={(e) => setField('business_hours', e.target.value)}/></Field>
              <div className="md:col-span-2">
                <Field label="Address"><input className="input" value={s.address || ''} onChange={(e) => setField('address', e.target.value)}/></Field>
              </div>
              <div className="md:col-span-2">
                <Field label="About / Description"><textarea className="input min-h-[90px]" value={s.about || ''} onChange={(e) => setField('about', e.target.value)}/></Field>
              </div>
            </div>
          </Section>

          {/* BUSINESS CREDENTIALS — TRUST SIGNALS */}
          <Section icon={Building2} title="Business Credentials (Trust Signals)" desc="Shown as trust badges on public pages. Leave blank to hide.">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="GST Number" hint="Shown prominently on footer & product pages">
                <input className="input font-mono" value={s.gst_number || ''} placeholder="22AAAAA0000A1Z5" onChange={(e) => setField('gst_number', e.target.value.toUpperCase())}/>
              </Field>
              <Field label="Udyam / MSME Number">
                <input className="input font-mono" value={s.udyam_number || ''} placeholder="UDYAM-XX-00-0000000" onChange={(e) => setField('udyam_number', e.target.value.toUpperCase())}/>
              </Field>
              <Field label="Owner Name"><input className="input" value={s.owner_name || ''} onChange={(e) => setField('owner_name', e.target.value)}/></Field>
              <Field label="Established Year"><input className="input" value={s.established_year || ''} placeholder="2014" onChange={(e) => setField('established_year', e.target.value)}/></Field>
              <Field label="Happy Customers Count" hint="e.g. 1000+"><input className="input" value={s.happy_customers || ''} onChange={(e) => setField('happy_customers', e.target.value)}/></Field>
              <Field label="Years of Trust" hint="e.g. 10+"><input className="input" value={s.years_of_trust || ''} onChange={(e) => setField('years_of_trust', e.target.value)}/></Field>
            </div>
          </Section>

          {/* BRAND IMAGES */}
          <Section icon={ImageIcon} title="Brand Images" desc="Logo and homepage hero image">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Logo', field: 'logo_url' as const, key: 'logo' as const, hint: 'Square image, transparent PNG preferred' },
                { label: 'Hero Image', field: 'hero_image_url' as const, key: 'hero' as const, hint: 'Landscape photo of your shop/fabric' },
              ].map((it) => (
                <div key={it.field} className="p-4 border border-slate-200 rounded-lg">
                  <div className="label">{it.label}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden grid place-items-center">
                      {s[it.field] ? <img src={resolveImage(s[it.field])} className="w-full h-full object-cover" alt=""/> : <ImageIcon size={22} className="text-slate-300"/>}
                    </div>
                    <label className="btn-secondary cursor-pointer">
                      {uploading === it.key ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], it.field)}/>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">{it.hint}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* SOCIAL */}
          <Section icon={Share2} title="Social Links" desc="Shown in footer. Leave blank to hide.">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Instagram URL"><input className="input" value={s.instagram_url || ''} placeholder="https://instagram.com/..." onChange={(e) => setField('instagram_url', e.target.value)}/></Field>
              <Field label="Facebook URL"><input className="input" value={s.facebook_url || ''} placeholder="https://facebook.com/..." onChange={(e) => setField('facebook_url', e.target.value)}/></Field>
              <Field label="YouTube URL"><input className="input" value={s.youtube_url || ''} placeholder="https://youtube.com/@..." onChange={(e) => setField('youtube_url', e.target.value)}/></Field>
              <Field label="Google Maps URL" hint="Short or full maps link"><input className="input" value={s.google_maps_url || ''} placeholder="https://maps.app.goo.gl/..." onChange={(e) => setField('google_maps_url', e.target.value)}/></Field>
            </div>
          </Section>

          {/* PAYMENT */}
          <Section icon={CreditCard} title="Payment Methods" desc="Shown on public site trust section">
            <Field label="Accepted Payment Methods" hint="Comma-separated">
              <input className="input" value={s.payment_methods || ''} onChange={(e) => setField('payment_methods', e.target.value)}/>
            </Field>
          </Section>

          {/* POLICIES */}
          <Section icon={FileText} title="Policies" desc="Each has its own public page at /policies/*">
            <div className="space-y-4">
              <Field label="Shipping & Delivery" hint="Shown at /policies/shipping">
                <textarea className="input min-h-[90px]" value={s.shipping_info || ''} onChange={(e) => setField('shipping_info', e.target.value)}/>
              </Field>
              <Field label="Return / Replacement Policy" hint="Shown at /policies/returns">
                <textarea className="input min-h-[90px]" value={s.return_policy || ''} onChange={(e) => setField('return_policy', e.target.value)}/>
              </Field>
              <Field label="Privacy Policy" hint="Shown at /policies/privacy">
                <textarea className="input min-h-[90px]" value={s.privacy_policy || ''} onChange={(e) => setField('privacy_policy', e.target.value)}/>
              </Field>
            </div>
          </Section>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? <><Loader2 className="animate-spin" size={14}/> Saving...</> : <><Save size={14}/> Save Changes</>}</button>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8 h-fit">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={18} className="text-slate-700"/>
              <h3 className="font-semibold text-slate-900">Change Password</h3>
            </div>
            <form onSubmit={changePassword} className="space-y-3">
              <Field label="Current Password"><input type="password" required className="input" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })}/></Field>
              <Field label="New Password"><input type="password" required minLength={6} className="input" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })}/></Field>
              <button disabled={savingPw} className="btn-primary w-full">{savingPw ? <><Loader2 className="animate-spin" size={14}/>Changing...</> : 'Change Password'}</button>
            </form>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-3">💡 Trust Tips</h3>
            <ul className="space-y-2 text-sm text-slate-600 list-disc pl-4">
              <li>Add your <b>GST number</b> — appears prominently on footer + product pages</li>
              <li>Set <b>Established Year</b> — "Since 2014" badge on site</li>
              <li>Link <b>Instagram</b> — textile buyers love to see fabric reels</li>
              <li>Fill all <b>Policies</b> — retailers check these before big orders</li>
              <li>Upload real shop <b>Hero Image</b> — increases authenticity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: any) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center flex-shrink-0"><Icon size={18}/></div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
