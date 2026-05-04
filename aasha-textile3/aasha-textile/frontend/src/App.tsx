import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Videos from './pages/Videos';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import Testimonials from './pages/Testimonials';
import ProtectedRoute from './components/ProtectedRoute';

import PublicLayout from './public/PublicLayout';
import Home from './public/Home';
import CategoryPage from './public/CategoryPage';
import ProductDetail from './public/ProductDetail';
import AboutPage from './public/AboutPage';
import CartPage from './public/CartPage';
import PolicyPage from './public/PolicyPage';
import NotFoundPublic from './public/NotFoundPublic';
import SearchPage from './public/SearchPage';

export default function App() {
  return (
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
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFoundPublic />} />
    </Routes>
  );
}
