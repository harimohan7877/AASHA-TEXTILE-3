# Aasha Textile

Premium B2B wholesale textile website with Admin Panel.

**Tech Stack**: React + Vite (frontend) · FastAPI + Python (backend) · MongoDB (database)

## Features
- Public website: Home, Categories, Product Detail, About, Policies (Shipping/Return/Privacy)
- Admin Panel: Products, Categories, Videos, Testimonials, Settings (full CRUD)
- WhatsApp CTA across the site
- Trust building: GST/MSME badges, Testimonials carousel, Verified credentials
- Mobile-first premium design

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # then edit values
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env  # then edit REACT_APP_BACKEND_URL
yarn start
```

## Deploy to Production (FREE)

See **[DEPLOY.md](./DEPLOY.md)** for full step-by-step guide:
- MongoDB Atlas (free tier)
- Render.com (backend, free tier)
- Vercel (frontend, free tier)
- Custom domain setup

## Admin Login
- URL: `/admin/login`
- Email: see `.env` (`ADMIN_EMAIL`)
- Password: see `.env` (`ADMIN_PASSWORD`)

## License
Private — © Aasha Textile
