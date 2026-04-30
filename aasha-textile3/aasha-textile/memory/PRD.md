# Aasha Textile — Admin Panel + Public B2B Website

## Original Problem Statement
Build a premium, mobile-first B2B wholesale textile site with a clean admin panel. Migrated from Supabase (locked-out) to a free MongoDB stack. Must include B2B "Trust Building" elements (GST, MSME, testimonials, policies). User communicates in Hindi/Hinglish.

## Tech Stack
- **Backend**: FastAPI + Motor (async MongoDB) + JWT auth
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **DB**: MongoDB (local container) — collections: products, categories, videos, settings, testimonials, admins, images
- **Images**: Stored as base64 in MongoDB OR external `ibb.co` URLs

## Admin Login
- URL: `/admin/login`
- Email: `hs6579178@gmail.com`
- Password: `787799hhh@@@` (synced from `backend/.env` on startup)
- See `/app/memory/test_credentials.md`

---

## Implementation Status

### ✅ Completed (cumulative)
- **Migration**: Supabase → MongoDB (`migrate.py`) — 18 products + videos + categories
- **Auth**: JWT-based admin login, password change, password sync from `.env`
- **Admin CRUD**: Dashboard, Products (with bulk-delete & image upload), Categories (with auto-virtual-rows from product data), Videos, Testimonials, Settings
- **Public Site**: Premium mobile-first design with `cream/stone/brand` palette
  - Home (hero, trust bar, categories, featured, videos, about strip, testimonials, contact)
  - Category pages, Product detail (with related), About page, Policy pages
  - Sticky WhatsApp FAB + WhatsApp CTAs across the site
- **Trust Building (Apr 2026)** — *latest milestone*:
  - Backend: extended Settings model (gst_number, udyam_number, established_year, owner_name, business_hours, happy_customers, years_of_trust, instagram_url, facebook_url, youtube_url, google_maps_url, payment_methods, shipping_info, return_policy, privacy_policy)
  - Backend: full Testimonials API (`/api/testimonials` public, `/api/testimonials/admin` protected, full CRUD, demo seed of 3)
  - Admin: Testimonials page registered at `/admin/testimonials`, sidebar menu, "View Public Site" link
  - Public Home: hero trust badges (GST Verified, MSME Registered, business hours), dynamic stats from settings, full TestimonialsSection (carousel + dots + mini grid)
  - Public Footer: GST/UDYAM badges, social icons, business hours, payments strip, policy links
  - Public AboutPage: Verified Business Credentials grid + TestimonialsSection
  - Public ProductDetail: policy snippet cards (Shipping / 7-day Return / GST Invoice)
  - Public Policy pages: `/policies/shipping`, `/policies/returns`, `/policies/privacy` (PolicyPage.tsx)
- **Testing**: Backend pytest (14/14 ✅) at `/app/backend/tests/test_api.py`. Frontend full regression by testing agent (100%).

### Backend (key files)
- `/app/backend/server.py` — single-file API
- `/app/backend/migrate.py` — one-time Supabase migration script (already executed)
- `/app/backend/tests/test_api.py` — pytest covering health/auth/settings/testimonials/categories CRUD

### Frontend (key files)
- Admin: `/app/frontend/src/pages/{Dashboard,Products,Categories,Videos,Testimonials,Settings,Login}.tsx`
- Public: `/app/frontend/src/public/{Home,CategoryPage,ProductDetail,AboutPage,PolicyPage,TestimonialsSection,PublicHeader,PublicFooter,PublicLayout,WhatsAppFab,ProductCard,usePublicData}.tsx`
- Routing: `/app/frontend/src/App.tsx`

---

## Backlog / Roadmap

### P1 — Engagement & SEO
- Per-product structured-data (JSON-LD) for Google Shopping rich results
- Sitemap.xml + robots.txt generated dynamically
- Meta titles/descriptions per product/category page
- Lazy-load product images with blur placeholder

### P2 — Conversion / B2B
- "Request Catalog" PDF download (auto-generated from products)
- Bulk WhatsApp inquiry — multiple products in one message
- Stock-status filter on category page
- Price-range filter & sort (low-high)

### P3 — Admin / Analytics
- Order/Inquiry log: capture WhatsApp click events into Mongo (analytics)
- Dashboard charts (products by category, monthly inquiries)
- Bulk product import via CSV/Excel
- Multi-admin support with roles

### P4 — Deploy
- Custom domain setup using Emergent "Deploy" button (backlog from earlier session)
- CDN-cache image responses

---

## API Quick Reference
- `POST /api/auth/login` → JWT
- `GET /api/public/settings` (no auth)
- `GET /api/public/products`, `GET /api/products/:id` (no auth)
- `GET /api/categories`, `GET /api/videos`, `GET /api/testimonials` (no auth)
- `GET /api/testimonials/admin` (auth required)
- Protected mutations: `POST/PATCH/DELETE` on products, categories, videos, testimonials, settings
- `POST /api/images/upload` (auth) → `{ id, url: /api/images/:id }`

## Notes
- Hot-reload: yes (no restart needed for code edits)
- ALL settings keys are backfilled with defaults on backend startup (non-destructive)
- Categories endpoint auto-detects "virtual" categories (used by products but not in categories collection) and shows them in admin
