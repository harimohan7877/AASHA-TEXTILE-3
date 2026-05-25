import { useState, useEffect, useMemo } from 'react';
import { X, Play, Loader2, Copy, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { resolveScannedCategory } from '../lib/ai';

// 257 sample image IDs from user's catalogue
const SAMPLE_IDS = ["C9eDwiP","C9eDe0F","C9eDWDQ","C9eDOf1","C9eD8Ja","C9eDUOv","C9eD4xp","C9eD6WN","C9eDtJs","C9eDD5G","C9eDbef","C9eDyzl","C9ebdq7","C9eb219","C9eb3ge","C9ebKdu","C9ebqej","C9ebBmx","C9ebnzQ","C9ebxLB","C9eb57a","C9eb7kJ","C9eblXp","C9ebcIR","C9eb0LN","C9ebMrX","C9ebW2n","C9ebX7s","C9ebNI4","C9ebOhl","C9ebeQ2","C9ebvBS","C9eb8E7","C9ebg2e","C9ebS49","C9eb6pj","C9ebrYu","C9ebLQV","C9ebZCB","C9ebtEP","C9ebD41","C9em9yJ","C9emJTv","C9emdjR","C9em2Qp","C9emKGI","C9emB3X","C9emCan","C9emnvs","C9emoyG","C9emzuf","C9emIj4","C9emYF9","C9emaae","C9emc8u","C9em1uj","C9emEwx","C9emGZQ","C9emWMB","C9emX6P","C9emjF1","C9emwcF","C9Grid-e9a","C9emkAJ","C9emvwv","C9em8tR","C9emUnp","C9emgMN","C9em6Ft","C9emPcX","C9emiSn","C9emL9s","C9emQAG","C9embol","C9empPS","C9epHl9","C9ep2Hu","C9ep3Ab","C9epFNj","C9epqoQ","C9epBVV","C9epCiB","C9epoKP","C9epxl1","C9epTHg","C9epuRa","C9epAOJ","C9epRDv","C9ep7xR","C9epYVp","C9epaiN","C9eplfI","C9ep0lt","C9ep1UX","C9epGJn","C9epWbf","C9epVOG","C9epMRs","C9epws2","C9Grid-e07","C9ep8Je","C9epkg9","C9epS5u","C9epUOb","C9epgbj","C9ep6WQ","C9epPsV","C9epsqB","C9epL0P","C9epQg1","C9uptdF","C9epD5g","C9epbea","C9epmmJ","C9epyzv","C9ey9XR","C9eyHsp","C9eydqN","C9ey21I","C9ey3gt","C9eyKdX","C9eyf7n","C9eyqes","C9eyBmG","C9eynIf","C9eyoX4","C9eyxLl","C9eyIB2","C9eyT1S","C9eyur7","C9eyR29","C9ey7ku","C9eycIj","C9eylhx","C9ey0LQ","C9eyEBV","C9eyGEB","C9eyMrP","C9eyW21","C9eyhkg","C9eyjpa","C9eyNTJ","C9eyOhv","C9eyeQR","C9ey8EN","C9eyS4I","C9eyg2t","C9eyrYX","C9ey4vn","C9eysjf","C9eytG2","C9eyD4S","C9eym37","C9eypa9","C9eyyve","C9k99yu","C9k9JTb","C9k92Zx","C9k9djj","C9k9FCQ","C9k9KGV","C9k9f6B","C9k9B3P","C9k9Ca1","C9k9oyg","C9k9IwJ","C9k9AnR","C9k9RGp","C9k956N","C9k9aat","C9k91us","C9k9EwG","C9k9Vn4","C9k9WMl","C9k9XP2","C9k9jFS","C9k9wc7","C9k9NS9","C9k9e9e","C9k9kAu","C9k9vwb","C9k98tj","C9k9Uox","C9k9gMQ","C9k9rPV","C9k96KB","C9k9PcP","C9k9iS1","C9k9ZNa","C9k9tDJ","C9k9bov","C9k9mVR","C9kH2HX","C9kH9KN","C9kHHlI","C9kHJSt","C9kHFNs","C9kHKDG","C9kHqxf","C9kHBV4","C9kHCil","C9kHof2","C9kHxlS","C9kHzU7","C9kHTJ9","C9kHuRe","C9kHAOu","C9kHRDb","C9kHaiQ","C9kHlfV","C9kH00B","C9kH1UP","C9kHM5F","C9kHGJ1","C9kHVOg","C9kHWba","C9kHjWv","C9kHOfp","C9kHe0N","C9kHkgI","C9kHS5X","C9kHgbs","C9kH4zG","C9kH6Xf","C9kHQgS","C9kHD79","C9kHmmu","C9kHyzb","C9kJ9Xj","C9kJdqQ","C9kJHLx","C9kJ21V","C9kJ3rB","C9kJf71","C9kJKdj","C9kJqkF","C9kJBmg","C9kJxLv","C9kJIBR","C9kJT1p","C9kJR2I","C9kJ57t","C9kJ7kX","C9kJcIs","C9kJYpn","C9kJlhG","C9kJ0Qf","C9kJGEl","C9kJM42","C9kJW2S","C9kJhv9","C9kJNTu","C9kJjpe","C9kJOhb","C9kJeQj","C9kJrYP","C9kJg3B"];

function getImageUrl(id: string) {
  id = id.trim();
  // 1. freeimage.host links (e.g., https://freeimage.host/i/CJcsfC7 or https://freeimage.host/image/CJcsfC7)
  const freeImageMatch = id.match(/freeimage\.host\/(?:i|image)\/([a-zA-Z0-9]+)/i);
  if (freeImageMatch) {
    return `https://iili.io/${freeImageMatch[1]}.jpg`;
  }

  // 2. ibb.co links (e.g., https://ibb.co/C9eDwiP)
  const ibbMatch = id.match(/ibb\.co\/([a-zA-Z0-9]+)/i);
  if (ibbMatch && !id.includes('i.ibb.co')) {
    return `https://i.ibb.co/${ibbMatch[1]}/image.jpg`;
  }

  // 3. If it's not a URL, assume it's a direct iili.io ID
  if (!id.startsWith('http')) {
    return `https://iili.io/${id}.jpg`;
  }

  return id;
}

// Convers image URL to base64 using corsproxy fallback
async function toBase64(url: string): Promise<{ b64: string; mime: string }> {
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('CORS blocked');
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onloadend = () => res({ b64: (fr.result as string).split(',')[1], mime: blob.type || 'image/jpeg' });
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch {
    const proxy = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxy);
    if (!r.ok) throw new Error('Proxy failed');
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onloadend = () => res({ b64: (fr.result as string).split(',')[1], mime: 'image/jpeg' });
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }
}

// Customized AI prompt to strictly forbid price guessing unless printed on image
const PROMPT = (n: number, categoryList: string[] = []) => {
  const catPrompt = categoryList.length > 0
    ? `Choose the best matching category from this list: [${categoryList.join(', ')}]. If none of them fit, select "Other" or the closest one.`
    : `Identify the category of the fabric (e.g., Cotton Fabrics, Rayon Fabrics, etc.).`;

  return `Identify the product name, category, variety, and description from the provided fabric image.
We are scanning ${n} product images. For each one, identify the product.
${catPrompt}

Return ONLY raw JSON array of objects (no markdown, no code blocks):
[{"n":1,"name":"Product Name (Hindi/English)","price":"₹XX","desc":"Max 8 words description","category":"Category Name","variety":"Printed/Plain/etc"}]

CRITICAL RULES:
1. Price extraction:
   - Do NOT guess, estimate, or assume the price under any circumstances.
   - If the price is NOT written as text directly on the image, you MUST output an empty string "" for the price field.
   - Only output a price (e.g., "₹350/meter", "400rs") if it is printed or written directly on the image itself.
2. Only return JSON. No other text.`;
};

function parseJSON(txt: string) {
  const clean = txt.replace(/```json|```/g, '').trim();
  const m = clean.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('JSON parse failed');
  return JSON.parse(m[0]);
}

interface ScannedProduct {
  no: number;
  image_url: string;
  name: string;
  category: string;
  rate: string;
  info: string;
  variety: string;
  isDuplicate: boolean;
  selected: boolean;
}

export default function AICatalogScannerModal({ categories, onClose, onSaved }: { categories: any[]; onClose: () => void; onSaved: () => void }) {
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [inputUrls, setInputUrls] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, txt: '', pct: 0 });
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [uploading, setUploading] = useState(false);

  // Save config values to localStorage
  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', apiKey);
  }, [provider, apiKey]);

  // Load sample images helper
  const loadSamples = () => {
    setInputUrls(SAMPLE_IDS.join('\n'));
    toast.success('257 Sample Image IDs loaded!');
  };

  // callGemini api client
  async function callGemini(key: string, batchUrls: string[], categoryNames: string[]) {
    const parts: any[] = [];
    for (const url of batchUrls) {
      try {
        const { b64, mime } = await toBase64(url);
        parts.push({ inlineData: { mimeType: mime, data: b64 } });
      } catch {
        parts.push({ text: `[Image unavailable: ${url}]` });
      }
    }
    parts.push({ text: PROMPT(batchUrls.length, categoryNames) });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 1200 } })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Gemini API Error');
    const txt = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
    return parseJSON(txt);
  }

  // callOpenAI api client
  async function callOpenAI(key: string, batchUrls: string[], categoryNames: string[]) {
    const imgContent: any[] = [];
    for (const url of batchUrls) {
      try {
        const { b64, mime } = await toBase64(url);
        imgContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'low' } });
      } catch {
        imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
      }
    }
    imgContent.push({ type: 'text', text: PROMPT(batchUrls.length, categoryNames) });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: imgContent }], max_tokens: 1200, temperature: 0.1 })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'OpenAI API Error');
    return parseJSON(data.choices?.[0]?.message?.content || '');
  }

  // callClaude api client
  async function callClaude(key: string, batchUrls: string[], categoryNames: string[]) {
    const imgContent: any[] = [];
    for (const url of batchUrls) {
      try {
        const { b64, mime } = await toBase64(url);
        imgContent.push({ type: 'image', source: { type: 'base64', media_type: mime, data: b64 } });
      } catch {
        imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
      }
    }
    imgContent.push({ type: 'text', text: PROMPT(batchUrls.length, categoryNames) });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1200, messages: [{ role: 'user', content: imgContent }] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Claude API Error');
    const txt = (data.content || []).map((b: any) => b.text || '').join('');
    return parseJSON(txt);
  }

  // callOpenRouter api client
  async function callOpenRouter(key: string, batchUrls: string[], categoryNames: string[]) {
    const imgContent: any[] = [];
    for (const url of batchUrls) {
      try {
        const { b64, mime } = await toBase64(url);
        imgContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'low' } });
      } catch {
        imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
      }
    }
    imgContent.push({ type: 'text', text: PROMPT(batchUrls.length, categoryNames) });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://aashatextile.com',
        'X-Title': 'Aasha Textile Admin Scanner'
      },
      body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages: [{ role: 'user', content: imgContent }], max_tokens: 1200, temperature: 0.1 })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'OpenRouter API Error');
    return parseJSON(data.choices?.[0]?.message?.content || '');
  }

  const handleScan = async () => {
    if (!apiKey.trim()) {
      toast.error('Pehle API Key fill karein!');
      return;
    }
    const lines = inputUrls.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('Koi Image URLs ya IDs input karein!');
      return;
    }

    setBusy(true);
    setScannedProducts([]);
    setProgress({ current: 0, total: lines.length, txt: 'Starting scan...', pct: 0 });

    const urls = lines.map(getImageUrl);
    const BATCH_SIZE = 4;
    const list: ScannedProduct[] = [];

    // 1. Fetch duplicates list in bulk from backend API
    let existingUrls: string[] = [];
    try {
      const dupRes = await api.post('/products/check-duplicates', { urls });
      existingUrls = dupRes.data.existing_urls || [];
    } catch (e) {
      console.error('Deduplication check failed:', e);
    }

    // 2. Loop in batches
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

      setProgress({
        current: i,
        total: urls.length,
        txt: `Batch ${batchNum}/${totalBatches} — processing ${i + 1} to ${Math.min(i + BATCH_SIZE, urls.length)} images...`,
        pct: Math.round((i / urls.length) * 100)
      });

      try {
        const categoryNames = categories.map(c => c.name);
        let aiResult: any[] = [];
        if (provider === 'gemini') aiResult = await callGemini(apiKey, batch, categoryNames);
        else if (provider === 'openai') aiResult = await callOpenAI(apiKey, batch, categoryNames);
        else if (provider === 'claude') aiResult = await callClaude(apiKey, batch, categoryNames);
        else if (provider === 'openrouter') aiResult = await callOpenRouter(apiKey, batch, categoryNames);

        aiResult.forEach((resItem, idx) => {
          const imgUrl = batch[idx];
          const isDuplicate = existingUrls.includes(imgUrl);
          list.push({
            no: i + idx + 1,
            image_url: imgUrl,
            name: resItem.name || 'Unknown Product',
            rate: resItem.price || '',
            info: resItem.desc || '',
            category: resolveScannedCategory(resItem.category, categories),
            variety: resItem.variety || 'Printed',
            isDuplicate,
            selected: !isDuplicate // default check non-duplicates, uncheck duplicates
          });
        });
      } catch (err: any) {
        console.error('Scan batch error:', err);
        batch.forEach((imgUrl, idx) => {
          const isDuplicate = existingUrls.includes(imgUrl);
          list.push({
            no: i + idx + 1,
            image_url: imgUrl,
            name: 'Scan Failed',
            rate: '',
            info: err?.message || 'API Error',
            category: categories[0]?.name || 'Other',
            variety: 'Printed',
            isDuplicate,
            selected: false
          });
        });
      }
      setScannedProducts([...list]);
    }

    setProgress({
      current: urls.length,
      total: urls.length,
      txt: 'Scan Completed!',
      pct: 100
    });
    setBusy(false);
    toast.success('Catalog Scan completed successfully!');
  };

  const handleUploadSelected = async () => {
    const selectedList = scannedProducts.filter(p => p.selected);
    if (selectedList.length === 0) {
      toast.error('Koi product select nahi kiya!');
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${selectedList.length} products to database...`);
    let successCount = 0;

    for (const item of selectedList) {
      try {
        const payload = {
          name: item.name,
          name_en: item.name, // Fallback english title to same
          rate: item.rate,
          info: item.info,
          image_url: item.image_url,
          images: [item.image_url],
          category: item.category,
          variety: item.variety,
          stock_status: 'available',
          is_featured: false,
          sort_order: 0
        };
        await api.post('/products', payload);
        successCount++;
      } catch (e) {
        console.error(`Upload failed for product ${item.name}:`, e);
      }
    }

    setUploading(false);
    toast.success(`${successCount} / ${selectedList.length} Products uploaded successfully!`, { id: toastId });
    if (successCount > 0) {
      onSaved();
    }
  };

  const updateScannedField = (idx: number, field: keyof ScannedProduct, val: any) => {
    const copy = [...scannedProducts];
    copy[idx] = { ...copy[idx], [field]: val };
    setScannedProducts(copy);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 overflow-auto" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/60" />
      <div className="relative bg-white rounded-2xl shadow-pop max-w-5xl w-full my-8 max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">🤖 AI Bulk Catalog Scanner</span>
            <span className="badge bg-emerald-50 text-emerald-700 text-xs">Beta</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Top warning notes */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs space-y-1">
            <h4 className="font-bold flex items-center gap-1"><HelpCircle size={14} /> AI Product Catalog Scan Instructions:</h4>
            <p>1. AI automatically fabric name, variety, description aur category ko parse karega.</p>
            <p>2. **Price Estimation Rule:** AI price ko guess nahi karega, agar image par rate likha hai tabhi fill karega warna blank chhod dega.</p>
            <p>3. Gemini API key aap <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-bold">aistudio.google.com</a> se free generate kar sakte hain.</p>
          </div>

          {/* Configuration Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">AI Provider</label>
              <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="gemini">Google Gemini (Recommended/Free)</option>
                <option value="openai">OpenAI GPT-4o-mini (Paid)</option>
                <option value="claude">Anthropic Claude (Paid)</option>
                <option value="openrouter">OpenRouter (Third-party)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">API Key</label>
              <input
                type="password"
                className="input"
                placeholder="API Key paste karein..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          {/* URLs Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label">Image URLs / IDs (one per line or comma-separated)</label>
              <button type="button" onClick={loadSamples} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                Load 257 Sample Image IDs
              </button>
            </div>
            <textarea
              className="input min-h-[100px] font-mono text-xs"
              placeholder="C9eDwiP, C9eDe0F... ya direct Image Links enter karein..."
              value={inputUrls}
              onChange={(e) => setInputUrls(e.target.value)}
            />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={handleScan}
              disabled={busy}
              className="btn-primary flex items-center gap-2 !py-2.5 !px-5"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              {busy ? 'Scanning...' : 'Start Scanning'}
            </button>

            {scannedProducts.length > 0 && !busy && (
              <button
                onClick={handleUploadSelected}
                disabled={uploading}
                className="btn-success flex items-center gap-2 !py-2.5 !px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Confirm & Upload Selected ({scannedProducts.filter(p => p.selected).length}) Products
              </button>
            )}
          </div>

          {/* Progress bar */}
          {(busy || progress.pct > 0) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-semibold">
                <span>{progress.txt}</span>
                <span>{progress.pct}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-brand-600 h-full transition-all duration-300" style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Scanned {progress.current} of {progress.total} images
              </div>
            </div>
          )}

          {/* Scanned Results Table */}
          {scannedProducts.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={scannedProducts.every(p => p.selected)}
                        onChange={(e) => setScannedProducts(scannedProducts.map(p => ({ ...p, selected: e.target.checked })))}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                    </th>
                    <th className="p-3 w-16">Image</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 w-32">Rate</th>
                    <th className="p-3 w-40">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scannedProducts.map((p, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50/50 ${p.isDuplicate ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={(e) => updateScannedField(idx, 'selected', e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-3">
                        <img
                          src={p.image_url}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-50"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'; }}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          className="input !py-1 !px-2 text-xs font-semibold"
                          value={p.name}
                          onChange={(e) => updateScannedField(idx, 'name', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          className="input !py-1 !px-2 text-xs"
                          placeholder="Rate (e.g. ₹350/meter)"
                          value={p.rate}
                          onChange={(e) => updateScannedField(idx, 'rate', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className="input !py-1 !px-2 text-xs bg-white"
                          value={p.category}
                          onChange={(e) => updateScannedField(idx, 'category', e.target.value)}
                        >
                          {categories.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          className="input !py-1 !px-2 text-xs"
                          value={p.info}
                          onChange={(e) => updateScannedField(idx, 'info', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        {p.isDuplicate ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle size={10} /> Duplicate
                          </span>
                        ) : p.name === 'Scan Failed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
