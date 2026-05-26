import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Videos from './pages/Videos';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import Testimonials from './pages/Testimonials';
import Reviews from './pages/Reviews';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import PublicLayout from './public/PublicLayout';
import Home from './public/Home';
import CategoryPage from './public/CategoryPage';
import ProductDetail from './public/ProductDetail';
import AboutPage from './public/AboutPage';
import CartPage from './public/CartPage';
import PolicyPage from './public/PolicyPage';
import NotFoundPublic from './public/NotFoundPublic';
import SearchPage from './public/SearchPage';
import FAQPage from './public/FAQPage';
import ContactPage from './public/ContactPage';
import { api } from './lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  },
});

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;

    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-L859X3524E', {
        page_path: path,
        page_title: document.title
      });
    }

    // Backend traffic visit tracking (Exclude admin section routes)
    if (!location.pathname.startsWith('/admin')) {
      api.post('/public/track-visit', {
        path: path,
        referrer: document.referrer || ''
      }).catch(() => {});
    }
  }, [location]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
    <AnalyticsTracker />
    <Routes>
      {/* ========== PUBLIC SITE ========== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/policies/:slug" element={<PolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* ========== ADMIN ========== */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="videos" element={<Videos />} />
        <Route path="categories" element={<Categories />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFoundPublic />} />
    </Routes>
    </ErrorBoundary>
  </QueryClientProvider>
  );
}
