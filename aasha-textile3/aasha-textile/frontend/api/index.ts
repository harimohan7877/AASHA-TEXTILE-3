import { applyCors } from './_lib/utils';
import { handleAuth } from './_lib/handlers/auth';
import { handleProducts } from './_lib/handlers/products';
import { handleCategories } from './_lib/handlers/categories';
import { handleDrops } from './_lib/handlers/drops';
import { handleVideos } from './_lib/handlers/videos';
import { handleTestimonials } from './_lib/handlers/testimonials';
import { handleReviews } from './_lib/handlers/reviews';
import { handleSettings } from './_lib/handlers/settings';
import { handleImages } from './_lib/handlers/images';
import { handleDashboard, handleTrackVisit } from './_lib/handlers/dashboard';
import { handleMeta } from './_lib/handlers/meta';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  // Extract clean path without query string or /api/ prefix
  let rawUrl = req.url || '';
  if (req.query?.path) {
    rawUrl = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  }

  // Strip leading /api/ or /
  let path = rawUrl.split('?')[0].replace(/^\/api\/?/, '').replace(/^\//, '');

  // Parse query params
  const urlObj = new URL(`http://localhost${req.url || '/'}`);
  const query: Record<string, string> = {};
  urlObj.searchParams.forEach((val, key) => {
    if (key !== 'path') query[key] = val;
  });
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (key !== 'path') query[key] = req.query[key];
    });
  }

  // Meta endpoints
  if (path === 'health') return handleMeta(req, res, 'health');
  if (path === 'robots.txt' || rawUrl.includes('robots.txt')) return handleMeta(req, res, 'robots');
  if (path === 'sitemap.xml' || rawUrl.includes('sitemap.xml')) return handleMeta(req, res, 'sitemap');

  // Root /api/
  if (!path || path === '') {
    return res.status(200).json({
      message: 'Aasha Textile Serverless API',
      status: 'active',
      version: '2.0.0',
    });
  }

  // Route: /api/auth/...
  if (path.startsWith('auth/')) {
    const sub = path.replace(/^auth\//, '');
    return handleAuth(req, res, sub);
  }

  // Route: /api/public/...
  if (path.startsWith('public/')) {
    const sub = path.replace(/^public\//, '');
    if (sub === 'settings') return handleSettings(req, res, '');
    if (sub === 'track-visit') return handleTrackVisit(req, res);
    if (sub === 'drops' || sub.startsWith('drops/')) return handleDrops(req, res, 'public');
    if (sub === 'products' || sub.startsWith('products/')) {
      const prodSub = sub.replace(/^products\/?/, '');
      return handleProducts(req, res, prodSub, query);
    }
  }

  // Route: /api/products...
  if (path === 'products' || path.startsWith('products/')) {
    const sub = path.replace(/^products\/?/, '');
    return handleProducts(req, res, sub, query);
  }

  // Route: /api/categories...
  if (path === 'categories' || path.startsWith('categories/')) {
    const sub = path.replace(/^categories\/?/, '');
    return handleCategories(req, res, sub);
  }

  // Route: /api/drops...
  if (path === 'drops' || path.startsWith('drops/')) {
    const sub = path.replace(/^drops\/?/, '');
    return handleDrops(req, res, sub);
  }

  // Route: /api/videos...
  if (path === 'videos' || path.startsWith('videos/')) {
    const sub = path.replace(/^videos\/?/, '');
    return handleVideos(req, res, sub);
  }

  // Route: /api/testimonials...
  if (path === 'testimonials' || path.startsWith('testimonials/')) {
    const sub = path.replace(/^testimonials\/?/, '');
    return handleTestimonials(req, res, sub);
  }

  // Route: /api/reviews...
  if (path === 'reviews' || path.startsWith('reviews/')) {
    const sub = path.replace(/^reviews\/?/, '');
    return handleReviews(req, res, sub);
  }

  // Route: /api/settings
  if (path === 'settings') {
    return handleSettings(req, res, '');
  }

  // Route: /api/images...
  if (path.startsWith('images/')) {
    const sub = path.replace(/^images\//, '');
    return handleImages(req, res, sub);
  }

  // Route: /api/dashboard...
  if (path.startsWith('dashboard/')) {
    const sub = path.replace(/^dashboard\//, '');
    return handleDashboard(req, res, sub);
  }

  return res.status(404).json({ error: `API route not found: /api/${path}` });
}
