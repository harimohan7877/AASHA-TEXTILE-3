# Aasha Textile — Complete Vercel Serverless Deployment Guide (100% Free)

Ye guide aapko **zero rupee** mein poori site (Frontend + Backend + Database + Cron) deploy karne mein madad karega.

**Stack**:
* **Frontend**: React + Vite + Tailwind CSS (Vercel)
* **Backend**: Vercel Serverless API Routes (Node.js/TypeScript — No separate server needed!)
* **Database**: MongoDB Atlas (512MB Lifetime Free Tier)
* **Automation**: Vercel Cron (Daily YouTube video auto-detection) + MongoDB TTL (5-day auto expiry)

---

## 🚀 Step 1 — MongoDB Atlas Setup (FREE)

1. https://www.mongodb.com/cloud/atlas/register par account banayein.
2. **Build a Database** → **M0 Free** select karein (Region: Mumbai/Singapore).
3. **Database Access** → Naya database user banayein (e.g. `aasha_admin` aur strong password).
4. **Network Access** → `Add IP Address` → `0.0.0.0/0` (Allow Access from Anywhere) karein.
5. **Connect** → **Drivers** → **Node.js** ya **Python** connection string copy karein:
   ```
   mongodb+srv://aasha_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   *(Isme `<password>` ki jagah apna actual database password dalein)*

### Run Setup Script (Phase 1 TTL Setup):
Apne computer par ek baar run karein taaki `drops` collection aur 5-day auto-expiry index ban jaye:
```bash
python backend/setup_drops_collection.py
```

---

## ⚡ Step 2 — Vercel Deployment (Frontend + Serverless Backend)

Ab aapko **Render** par alag se backend chalane ki bilkul zaroorat nahi hai. Sab kuch Vercel par ek saath chalega!

1. https://vercel.com par login karein (Continue with GitHub).
2. **Add New** → **Project** → repo `AASHA-TEXTILE-3` select karein.
3. Settings:
   - **Framework Preset**: `Vite` (Auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build` (ya `npm run build`)
   - **Output Directory**: `dist`

4. **Environment Variables** (Vercel Settings → Environment Variables mein ye add karein):
   ```env
   MONGO_URL=mongodb+srv://aasha_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=aasha_textile
   JWT_SECRET=aasha_secret_key_random_32_chars_long
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_HOURS=168
   ADMIN_EMAIL=hs6579178@gmail.com
   ADMIN_PASSWORD=787799hhh@@@
   
   # Optional (YouTube Cron Auto-Detection):
   # YOUTUBE_API_KEY=your_youtube_api_key
   # YOUTUBE_UPLOADS_PLAYLIST_ID=UU...
   ```
   *(Note: `REACT_APP_BACKEND_URL` ko blank rakhein ya remove kar dein taaki sabhi calls Vercel ke serverless functions par jayein)*

5. **Deploy** button click karein.
   1-2 minute mein aapki site live ho jayegi! 🎉

---

## 🌐 Step 3 — Custom Domain Connect Karein (`aashatextile.com`)

1. Vercel Dashboard → **Settings** → **Domains** par jayein.
2. Apna domain enter karein (e.g. `aashatextile.com`).
3. Vercel ke 2 DNS records (A Record: `76.76.21.21` aur CNAME: `cname.vercel-dns.com`) apne domain registrar (Hostinger/GoDaddy) ke DNS panel mein dalein.
4. SSL Certificate aur Domain 10-15 minute mein auto-active ho jayega.

---

## 🛑 Step 4 — Render Service Downgrade / Cancel (Retirement)

Pura traffic Vercel par successfully chalne ke baad:
1. Render Dashboard par jayein.
2. Purana backend service suspend/cancel kar dein.
3. Ab aapka Render ka cold sleep issue hamesha ke liye khatam ho gaya hai!

---

## 🔄 Step 5 — End-to-End Testing Flow

1. **Admin Panel**:
   - `/admin/login` par login karein (`hs6579178@gmail.com` / `787799hhh@@@`).
   - **Video Drops** tab mein jayein.
   - **New Video Drop** par click karke YouTube link dalein.
   - Drop banne ke baad **Add Product** se us video ke fabric pieces ki photo, rate aur details dalein.
2. **Public Website**:
   - `/` (Home) ya `/drops` par jayein.
   - Video player aur neeche product grid dikhegi.
   - **Order on WhatsApp** par click karein — pre-filled message ke sath WhatsApp open hoga.
3. **Auto-Expiry / Delete**:
   - 5 din ke baad MongoDB TTL se drop apne aap gayab ho jayega.
   - Admin chahe toh **Delete** button daba kar turant bhi hata sakta hai.
