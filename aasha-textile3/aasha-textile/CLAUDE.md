# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

```
aasha-textile3/aasha-textile/
├── backend/           # FastAPI + Motor (async MongoDB)
│   ├── server.py      # Single-file API
│   ├── migrate.py     # One-time Supabase migration (already run)
│   ├── migrate_to_atlas.py
│   └── tests/test_api.py
├── frontend/          # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/     # Admin pages: Dashboard, Products, Categories, Videos, Testimonials, Settings, Login
│   │   ├── public/    # Public pages: Home, CategoryPage, ProductDetail, AboutPage, CartPage, PolicyPage, etc.
│   │   ├── components/  # Layout, ProtectedRoute
│   │   ├── lib/       # api.ts, auth.tsx, utils.ts
│   │   └── App.tsx    # All routing
│   └── ...
└── memory/PRD.md       # Full project history and roadmap
```

The actual working directory is `aasha-textile3/aasha-textile/`.

## Commands

### Backend
```bash
cd aasha-textile3/aasha-textile/backend
pip install -r requirements.txt
cp .env.example .env  # then configure
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd aasha-textile3/aasha-textile/frontend
yarn install
yarn dev        # development (port 3000)
yarn build      # production build
```

### Testing
```bash
cd aasha-textile3/aasha-textile/backend
pytest tests/test_api.py -v        # all tests
pytest tests/test_api.py -k auth   # single test
```

## Architecture

- **Backend** (single `server.py`): FastAPI router with `/api` prefix. Motor async MongoDB. JWT auth via HTTPBearer. Rate limiting via slowapi.
- **Frontend**: React Router v6. Two route groups: Public (no auth) under `PublicLayout`, Admin (auth-gated) under `Layout`. PublicLayout has no sidebar — it's the customer-facing site.
- **Auth flow**: JWT stored in `localStorage` as `aasha_token`. Axios interceptor in `api.ts` attaches it to every request. 401 responses redirect to `/admin/login`.
- **Images**: Stored as base64 in MongoDB OR external `ibb.co` URLs. `resolveImage()` in `api.ts` resolves `/api/images/:id` paths to full backend URL.
- **Settings**: Auto-backfilled with defaults on backend startup. Public settings at `/api/public/settings` (no auth).

## Admin Access
- URL: `/admin/login`
- Email: `hs6579178@gmail.com` (from `backend/.env` `ADMIN_EMAIL`)
- Password: from `backend/.env` `ADMIN_PASSWORD`
- JWT expires in 168 hours (1 week). Admin credentials sync from `.env` on server startup.

## Key Patterns
- Admin pages under `src/pages/` use `useAuth()` hook for auth checks.
- `ProtectedRoute` component wraps all `/admin/*` routes.
- `src/public/` pages are customer-facing — they share the same `api.ts` but don't use auth.
- Categories endpoint auto-detects "virtual" categories (used by products but not in the categories collection) and includes them in admin.

## Recent Improvements (2026)
- **React Query**: All public data hooks (`useProducts`, `useCategories`, `useSettings`, etc.) now use `@tanstack/react-query` with 5-minute stale time for automatic caching.
- **LazyImage Component**: New reusable component in `src/components/LazyImage.tsx` with blur placeholder effect.
- **Pagination**: Backend endpoints `/api/products` and `/api/public/products` now support `page` and `per_page` query params.
- **SEO**: JSON-LD structured data added to ProductDetail and PublicLayout. Dynamic Open Graph tags for product pages.
- **Image CDN**: Images are external URLs (ibb.co). Lazy loading with blur placeholder improves perceived performance.