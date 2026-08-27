import { connectToDatabase } from './_lib/mongodb';
import { applyCors } from './_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const base = 'https://aashatextile.com';

    const cats = await db.collection('categories').find({}).limit(100).toArray();
    const products = await db.collection('products').find({}).limit(1000).toArray();

    const urls = [
      { loc: `${base}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${base}/about`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${base}/faq`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${base}/contact`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${base}/cart`, changefreq: 'daily', priority: '0.6' },
      { loc: `${base}/search`, changefreq: 'daily', priority: '0.6' },
      { loc: `${base}/policies/shipping`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${base}/policies/returns`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${base}/policies/privacy`, changefreq: 'monthly', priority: '0.5' },
    ];

    for (const c of cats) {
      const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({ loc: `${base}/category/${slug}`, changefreq: 'weekly', priority: '0.8' });
    }

    for (const p of products) {
      urls.push({ loc: `${base}/product/${p.id}`, changefreq: 'weekly', priority: '0.7' });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const u of urls) {
      xml += `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    }
    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Sitemap generation failed' });
  }
}
