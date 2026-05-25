// Client-side AI API runners for Aasha Textile catalog tools

export const SAMPLE_IDS = ["C9eDwiP","C9eDe0F","C9eDWDQ","C9eDOf1","C9eD8Ja","C9eDUOv","C9eD4xp","C9eD6WN","C9eDtJs","C9eDD5G","C9eDbef","C9eDyzl","C9ebdq7","C9eb219","C9eb3ge","C9ebKdu","C9ebqej","C9ebBmx","C9ebnzQ","C9ebxLB","C9eb57a","C9eb7kJ","C9eblXp","C9ebcIR","C9eb0LN","C9ebMrX","C9ebW2n","C9ebX7s","C9ebNI4","C9ebOhl","C9ebeQ2","C9ebvBS","C9eb8E7","C9ebg2e","C9ebS49","C9eb6pj","C9ebrYu","C9ebLQV","C9ebZCB","C9ebtEP","C9ebD41","C9em9yJ","C9emJTv","C9emdjR","C9em2Qp","C9emKGI","C9emB3X","C9emCan","C9emnvs","C9emoyG","C9emzuf","C9emIj4","C9emYF9","C9emaae","C9emc8u","C9em1uj","C9emEwx","C9emGZQ","C9emWMB","C9emX6P","C9emjF1","C9emwcF","C9Grid-e9a","C9emkAJ","C9emvwv","C9em8tR","C9emUnp","C9emgMN","C9em6Ft","C9emPcX","C9emiSn","C9emL9s","C9emQAG","C9embol","C9empPS","C9epHl9","C9ep2Hu","C9ep3Ab","C9epFNj","C9epqoQ","C9epBVV","C9epCiB","C9epoKP","C9epxl1","C9epTHg","C9epuRa","C9epAOJ","C9epRDv","C9ep7xR","C9epYVp","C9epaiN","C9eplfI","C9ep0lt","C9ep1UX","C9epGJn","C9epWbf","C9epVOG","C9epMRs","C9epws2","C9Grid-e07","C9ep8Je","C9epkg9","C9epS5u","C9epUOb","C9epgbj","C9ep6WQ","C9epPsV","C9epsqB","C9epL0P","C9epQg1","C9uptdF","C9epD5g","C9epbea","C9epmmJ","C9epyzv","C9ey9XR","C9eyHsp","C9eydqN","C9ey21I","C9ey3gt","C9eyKdX","C9eyf7n","C9eyqes","C9eyBmG","C9eynIf","C9eyoX4","C9eyxLl","C9eyIB2","C9eyT1S","C9eyur7","C9eyR29","C9ey7ku","C9eycIj","C9eylhx","C9ey0LQ","C9eyEBV","C9eyGEB","C9eyMrP","C9eyW21","C9eyhkg","C9eyjpa","C9eyNTJ","C9eyOhv","C9eyeQR","C9ey8EN","C9eyS4I","C9eyg2t","C9eyrYX","C9ey4vn","C9eysjf","C9eytG2","C9eyD4S","C9eym37","C9eypa9","C9eyyve","C9k99yu","C9k9JTb","C9k92Zx","C9k9djj","C9k9FCQ","C9k9KGV","C9k9f6B","C9k9B3P","C9k9Ca1","C9k9oyg","C9k9IwJ","C9k9AnR","C9k9RGp","C9k956N","C9k9aat","C9k91us","C9k9EwG","C9k9Vn4","C9k9WMl","C9k9XP2","C9k9jFS","C9k9wc7","C9k9NS9","C9k9e9e","C9k9kAu","C9k9vwb","C9k98tj","C9k9Uox","C9k9gMQ","C9k9rPV","C9k96KB","C9k9PcP","C9k9iS1","C9k9ZNa","C9k9tDJ","C9k9bov","C9k9mVR","C9kH2HX","C9kH9KN","C9kHHlI","C9kHJSt","C9kHFNs","C9kHKDG","C9kHqxf","C9kHBV4","C9kHCil","C9kHof2","C9kHxlS","C9kHzU7","C9kHTJ9","C9kHuRe","C9kHAOu","C9kHRDb","C9kHaiQ","C9kHlfV","C9kH00B","C9kH1UP","C9kHM5F","C9kHGJ1","C9kHVOg","C9kHWba","C9kHjWv","C9kHOfp","C9kHe0N","C9kHkgI","C9kHS5X","C9kHgbs","C9kH4zG","C9kH6Xf","C9kHQgS","C9kHD79","C9kHmmu","C9kHyzb","C9kJ9Xj","C9kJdqQ","C9kJHLx","C9kJ21V","C9kJ3rB","C9kJf71","C9kJKdj","C9kJqkF","C9kJBmg","C9kJxLv","C9kJIBR","C9kJT1p","C9kJR2I","C9kJ57t","C9kJ7kX","C9kJcIs","C9kJYpn","C9kJlhG","C9kJ0Qf","C9kJGEl","C9kJM42","C9kJW2S","C9kJhv9","C9kJNTu","C9kJjpe","C9kJOhb","C9kJeQj","C9kJrYP","C9kJg3B"];

export function getImageUrl(id: string) {
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

export async function toBase64(url: string): Promise<{ b64: string; mime: string }> {
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

export const PROMPT = (n: number) => `Identify the product name, category, variety, and description from the provided fabric image.
We are scanning ${n} product images. For each one, identify the product.
Return ONLY raw JSON array of objects (no markdown, no code blocks):
[{"n":1,"name":"Product Name (Hindi/English)","price":"₹XX","desc":"Max 8 words description","category":"Category Name","variety":"Printed/Plain/etc"}]

CRITICAL RULES:
1. Price extraction:
   - Do NOT guess, estimate, or assume the price under any circumstances.
   - If the price is NOT written as text directly on the image, you MUST output an empty string "" for the price field.
   - Only output a price (e.g., "₹350/meter", "400rs") if it is printed or written directly on the image itself.
2. Only return JSON. No other text.`;

export function parseJSON(txt: string) {
  const clean = txt.replace(/```json|```/g, '').trim();
  const m = clean.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('JSON parse failed');
  return JSON.parse(m[0]);
}

async function callGemini(key: string, batchUrls: string[]) {
  const parts: any[] = [];
  for (const url of batchUrls) {
    try {
      const { b64, mime } = await toBase64(url);
      parts.push({ inlineData: { mimeType: mime, data: b64 } });
    } catch {
      parts.push({ text: `[Image unavailable: ${url}]` });
    }
  }
  parts.push({ text: PROMPT(batchUrls.length) });

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

async function callOpenAI(key: string, batchUrls: string[]) {
  const imgContent: any[] = [];
  for (const url of batchUrls) {
    try {
      const { b64, mime } = await toBase64(url);
      imgContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'low' } });
    } catch {
      imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
    }
  }
  imgContent.push({ type: 'text', text: PROMPT(batchUrls.length) });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: imgContent }], max_tokens: 1200, temperature: 0.1 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI API Error');
  return parseJSON(data.choices?.[0]?.message?.content || '');
}

async function callClaude(key: string, batchUrls: string[]) {
  const imgContent: any[] = [];
  for (const url of batchUrls) {
    try {
      const { b64, mime } = await toBase64(url);
      imgContent.push({ type: 'image', source: { type: 'base64', media_type: mime, data: b64 } });
    } catch {
      imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
    }
  }
  imgContent.push({ type: 'text', text: PROMPT(batchUrls.length) });

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

async function callOpenRouter(key: string, batchUrls: string[]) {
  const imgContent: any[] = [];
  for (const url of batchUrls) {
    try {
      const { b64, mime } = await toBase64(url);
      imgContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'low' } });
    } catch {
      imgContent.push({ type: 'text', text: `[Image unavailable: ${url}]` });
    }
  }
  imgContent.push({ type: 'text', text: PROMPT(batchUrls.length) });

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

export async function callAI(provider: string, key: string, batchUrls: string[]) {
  if (provider === 'gemini') return callGemini(key, batchUrls);
  if (provider === 'openai') return callOpenAI(key, batchUrls);
  if (provider === 'claude') return callClaude(key, batchUrls);
  if (provider === 'openrouter') return callOpenRouter(key, batchUrls);
  throw new Error('Unknown provider');
}
