# 🎥 Aasha Textile — Video Drop Automator

यह टूल आपके नए YouTube वीडियो से ऑटोमैटिकली HD स्क्रीनशॉट्स (फोटोज़) निकालकर सीधे वेबसाइट `aashatextile.com/drops` पर 5-दिन की एक्सपायरी के साथ पब्लिश कर देता है।

---

## 🚀 पहली बार सेटअप (One-Time Setup)

टर्मिनल या कमांड प्रॉम्प्ट में यह कमांड चलाएं:
```bash
pip install requests Pillow yt-dlp
```
*(नोट: अगर आपके सिस्टम में ffmpeg इनस्टॉल है तो यह सबसे बेस्ट 1080p क्वालिटी देता है)*

---

## 📌 रोज़ाना इस्तेमाल करने का 3-स्टेप तरीका:

### Step 1: Gemini AI से पूछें (Copy-Paste Prompt)
YouTube पर नई वीडियो खोलकर Gemini AI में यह प्रॉम्प्ट डालें:

> **Gemini Prompt:**
> ```text
> Is video ko dekh kar har alag-alag kapde (fabric) ke best clear frame ka timestamp (jaise 01:25), kapde ka naam, rate (price), aur panna/cut mujhe neeche diye format me JSON list me do:
> [
>   {"time": "01:24", "name": "Heavy Rayon Print", "rate": "₹65/m", "details": "44 Panna, Cut 10m"},
>   {"time": "03:45", "name": "Cotton Slub Plain", "rate": "₹52/m", "details": "58 Panna, Cut 20m"}
> ]
> ```

---

### Step 2: स्क्रिप्ट चलाएं
टर्मिनल में जाएं और लिखें:
```bash
python tools/video_drop_automator/create_drop_from_youtube.py
```

1. **YouTube Link:** वीडियो का लिंक पेस्ट करें।
2. **Title:** वीडियो का टाइटल डालें (या Enter दबाएं)।
3. **Gemini JSON:** Gemini का दिया हुआ JSON पेस्ट करें, फिर अगली लाइन में `DONE` लिखकर `Enter` दबा दें।

---

### Step 3: रिज़ल्ट
* स्क्रिप्ट YouTube से सीधे हर टाइमस्टैम्प का HD फोटो खींचेगी।
* फोटो को 5-Day Auto Expiry टैग के साथ वेबसाइट पर अपलोड कर देगी।
* आपका ड्रॉप तुरंत लाइव हो जाएगा: 👉 **https://aashatextile.com/drops**
