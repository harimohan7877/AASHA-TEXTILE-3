import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type Product = {
  id: string;
  name: string;
  name_en?: string;
  variety?: string;
  rate?: string;
  cut?: string;
  panna?: string;
  info?: string;
  image_url?: string;
  category: string;
  stock_status: string;
  is_featured: boolean;
  sort_order: number;
};

export type Category = {
  id: string | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  product_count?: number;
  virtual?: boolean;
};

export type Video = {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url?: string;
  sort_order: number;
};

export type Testimonial = {
  id: string;
  author_name: string;
  city?: string;
  author_role?: string;
  rating: number;
  message: string;
  avatar_url?: string;
  sort_order: number;
  is_published: boolean;
};

export type SiteSettings = {
  store_name?: string;
  tagline?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  email?: string;
  logo_url?: string;
  hero_image_url?: string;
  about?: string;
  // Trust signals
  gst_number?: string;
  udyam_number?: string;
  established_year?: string;
  owner_name?: string;
  business_hours?: string;
  happy_customers?: string;
  years_of_trust?: string;
  // Social
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  google_maps_url?: string;
  // Policies (full text shown on policy pages)
  payment_methods?: string;
  shipping_info?: string;
  return_policy?: string;
  privacy_policy?: string;
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    api.get('/public/settings').then((r) => setSettings(r.data || {})).catch(() => setSettings({}));
  }, []);
  return settings;
}

export function useProducts(params?: { category?: string; featured?: boolean; limit?: number; q?: string }) {
  const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => {
    const query: any = {};
    if (params?.category) query.category = params.category;
    if (params?.featured !== undefined) query.featured = params.featured;
    if (params?.limit) query.limit = params.limit;
    if (params?.q) query.q = params.q;
    api.get('/public/products', { params: query }).then((r) => setItems(r.data.items || [])).catch(() => setItems([]));
  }, [params?.category, params?.featured, params?.limit, params?.q]);
  return items;
}

export function useCategories() {
  const [items, setItems] = useState<Category[] | null>(null);
  useEffect(() => {
    api.get('/categories').then((r) => setItems(r.data.items || [])).catch(() => setItems([]));
  }, []);
  return items;
}

export function useVideos() {
  const [items, setItems] = useState<Video[] | null>(null);
  useEffect(() => {
    api.get('/videos').then((r) => setItems(r.data.items || [])).catch(() => setItems([]));
  }, []);
  return items;
}

export function useTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  useEffect(() => {
    api.get('/testimonials').then((r) => setItems(r.data.items || [])).catch(() => setItems([]));
  }, []);
  return items;
}

export function whatsappLink(number: string | undefined, message?: string) {
  const clean = (number || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(message || 'Hi, I saw your products on your website and would like to know more.');
  if (!clean) return '#';
  return `https://wa.me/${clean}${text ? `?text=${text}` : ''}`;
}

export function slugify(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category';
}
