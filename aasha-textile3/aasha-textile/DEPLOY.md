# Aasha Textile — Free Deployment Guide

Ye guide aapko **zero rupee** mein apni site deploy karne mein madad karega.

**Stack**: React/Vite frontend + FastAPI backend + MongoDB

**Free hosting**: Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

---

## 📦 Step 0 — Local me code extract karke GitHub par push karein

```bash
# Zip ko apne computer pe extract karo
unzip aasha-textile.zip
cd aasha-textile

# Naya git repo init karo
git init
git add .
git commit -m "Initial commit - Aasha Textile"
git branch -M main
git remote add origin https://github.com/harimohan7877/AASHA-TEXTILE-3.git
git push -u origin main
```

> ⚠️ Agar GitHub repo pe pehle se kuch hai (README, gitignore), toh:
> ```bash
> git pull origin main --allow-unrelated-histories
> git push -u origin main
> ```

---

## 🗄️ Step 1 — MongoDB Atlas (FREE — 512 MB lifetime)

1. https://www.mongodb.com/cloud/atlas/register → Sign up
2. **Build a Database** → **M0 Free** (Mumbai/Singapore region)
3. **Database Access** → naya user banao (e.g. `aasha_admin` / strong password)
4. **Network Access** → `Add IP Address` → `0.0.0.0/0` (allow from anywhere)
5. **Connect** → **Drivers** → **Python** → connection string copy karo
   ```
   mongodb+srv://aasha_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Is string mein `<password>` ko apne actual password se replace karo

### Existing data (18 products) ko Atlas pe move karein:

Agar aap apna local DB data Atlas pe le jaana chahte ho, `migrate_to_atlas.py` script use karein (already shipped in `/backend/`):

```bash
cd backend
pip install pymongo motor python-dotenv
python migrate_to_atlas.py
# Aapko purana MONGO_URL aur naya ATLAS_URL maange ga
```

---

## ⚙️ Step 2 — Backend Render.com pe Deploy (FREE)

1. https://dashboard.render.com → **GitHub se Sign in**
2. **New +** → **Web Service** → repo `AASHA-TEXTILE-3` connect karo
3. Settings:
   - **Name**: `aasha-textile-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**

4. **Environment Variables** (add these one by one):
   ```
   MONGO_URL = <Atlas connection string from Step 1>
   DB_NAME = aasha_textile
   JWT_SECRET = <kuch bhi random 32 char string, e.g. abc123def456ghi789jkl012mno345pq>
   JWT_ALGORITHM = HS256
   JWT_EXPIRE_HOURS = 168
   ADMIN_EMAIL = hs6579178@gmail.com
   ADMIN_PASSWORD = 787799hhh@@@
   CORS_ORIGINS = *
   ```

5. **Create Web Service** → 3-5 min wait karein → URL milega:
   ```
   https://aasha-textile-api.onrender.com
   ```

6. Test karne ke liye browser mein khol ke check karo: `https://aasha-textile-api.onrender.com/api/health`
   - `{"status":"ok"}` aana chahiye

> 💡 **Render free tier 15 min idle ke baad sleep ho jaata hai**. Solution: https://uptimerobot.com pe sign up karke har 5 min ka HTTP ping setup kar do `https://aasha-textile-api.onrender.com/api/health` pe — site kabhi sleep nahi hogi.

---

## 🎨 Step 3 — Frontend Vercel pe Deploy (FREE)

1. https://vercel.com → **Continue with GitHub**
2. **Add New** → **Project** → repo `AASHA-TEXTILE-3` import karo
3. Settings:
   - **Framework Preset**: Vite (auto-detect ho jayega)
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build` (default)
   - **Output Directory**: `dist` (default)

4. **Environment Variables**:
   ```
   REACT_APP_BACKEND_URL = https://aasha-textile-api.onrender.com
   ```
   (Render se mili URL — bina `/` ke last me)

5. **Deploy** → 1-2 min me URL milega:
   ```
   https://aasha-textile-3.vercel.app
   ```

6. Site khol ke check karo — sab kaam karna chahiye 🎉

---

## 🌐 Step 4 — Apna domain connect karein (FREE — already aapke paas hai)

1. Vercel project → **Settings** → **Domains**
2. Apna domain enter karo (e.g. `aashatextile.com`)
3. Vercel aapko **2 DNS records** dega:
   - `A` record: `76.76.21.21`
   - `CNAME` record: `cname.vercel-dns.com`
4. Apne domain registrar (GoDaddy/Hostinger/BigRock) ke DNS panel mein ye records add karo
5. 5-30 min mein domain live ho jayega + automatic FREE SSL (https://)

---

## ✅ Final Checklist

- [ ] GitHub par code push ho gaya
- [ ] MongoDB Atlas cluster bana, connection string mil gayi
- [ ] Render pe backend live, `/api/health` working
- [ ] Vercel pe frontend live, public URL working
- [ ] Admin login `/admin/login` se ho raha hai
- [ ] Custom domain connect ho gaya (optional)
- [ ] UptimeRobot 5-min ping setup ho gaya (Render sleep prevention)

---

## 🆘 Common Issues

**Q: Frontend pe products nahi dikh rahe?**
A: Check `REACT_APP_BACKEND_URL` Vercel mein sahi hai. Browser DevTools → Network tab mein check karo `/api/...` calls 200 aa rahe hain ya nahi. CORS error ho toh Render backend env me `CORS_ORIGINS=*` ya apna Vercel URL daalo.

**Q: Render backend 500 dera hai?**
A: Render Dashboard → Logs check karo. 99% chances `MONGO_URL` galat hai ya Atlas Network Access me `0.0.0.0/0` allow nahi kiya.

**Q: Pehla request bahut slow (30 sec) hai?**
A: Free Render sleep ke baad cold start hota hai. UptimeRobot ping setup karne se solve ho jayega.

**Q: Admin login nahi ho raha?**
A: Render env mein `ADMIN_EMAIL` aur `ADMIN_PASSWORD` exact same hone chahiye jo aap login pe daal rahe ho.

---

## 📁 Folder Structure (Reference)

```
aasha-textile/
├── backend/
│   ├── server.py           # FastAPI app (single file)
│   ├── migrate.py          # Old Supabase migration (already done)
│   ├── migrate_to_atlas.py # Local Mongo → Atlas
│   ├── requirements.txt
│   ├── tests/
│   └── .env.example        # Sample env (real .env not in zip)
├── frontend/
│   ├── src/
│   │   ├── pages/          # Admin: Dashboard, Products, Categories, Videos, Testimonials, Settings
│   │   ├── public/         # Public site: Home, Category, Product, About, Policies, etc.
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── memory/
│   └── test_credentials.md
└── DEPLOY.md               # Ye file
```

---

🎉 **Bas itna hi! Sab steps follow karne ke baad aapki site live ho jayegi — ZERO rupee mein.**

Koi step me atak jao toh chat me poochh lo — me help kar dunga.
