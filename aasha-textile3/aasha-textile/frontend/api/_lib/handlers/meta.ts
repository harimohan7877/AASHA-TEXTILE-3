import { connectToDatabase } from '../mongodb';
import { applyCors, slugify } from '../utils';

export async function handleMeta(req: any, res: any, type: 'health' | 'sitemap' | 'robots') {
  if (applyCors(req, res)) return;

  if (type === 'health') {
    return res.status(200).json({
      status: 'healthy',
      service: 'aasha-textile-serverless-api',
      timestamp: new Date().toISOString(),
    });
  }

  if (type === 'robots') {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*

Sitemap: https://aashatextile.com/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(robotsTxt);
  }

  if (type === 'sitemap') {
    try {
      const { db } = await connectToDatabase();
      const baseUrl = 'https://aashatextile.com';

      const products = await db.collection('products').find({}, { projection: { id: 1, updated_at: 1 } }).toArray();
      const categories = await db.collection('categories').find({}, { projection: { name: 1, slug: 1 } }).toArray();

      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/drops', priority: '0.9', changefreq: 'daily' },
        { loc: '/about', priority: '0.8', changefreq: 'monthly' },
        { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
        { loc: '/faq', priority: '0.7', changefreq: 'monthly' },
        { loc: '/policies/shipping', priority: '0.5', changefreq: 'monthly' },
        { loc: '/policies/returns', priority: '0.5', changefreq: 'monthly' },
        { loc: '/policies/privacy', priority: '0.5', changefreq: 'monthly' },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      staticPages.forEach((p) => {
        xml += `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>\n`;
      });

      categories.forEach((c) => {
        const slug = c.slug || slugify(c.name);
        xml += `  <url>
    <loc>${baseUrl}/category/${encodeURIComponent(slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });

      products.forEach((p) => {
        xml += `  <url>
    <loc>${baseUrl}/product/${p.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(xml);
    } catch {
      return res.status(500).json({ error: 'Failed to generate sitemap' });
    }
  }
}
