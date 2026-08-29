import { MongoClient, Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ============================================================
// DATABASE CONNECTION (Cached for Serverless)
// ============================================================
const uri = process.env.MONGO_URL || '';
const dbName = process.env.DB_NAME || 'aasha_textile';
const JWT_SECRET = process.env.JWT_SECRET || 'aasha-secret-key-fallback-2026';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesEnsured = false;

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;
  try {
    // 5-day auto expiry on drops and temporary drop images
    await db.collection('drops').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('images').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexesEnsured = true;
  } catch (e) {
    // ignore if index already exists
  }
}

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!uri) {
    throw new Error('MONGO_URL environment variable is not set in Vercel settings.');
  }

  if (cachedClient && cachedDb) {
    ensureIndexes(cachedDb).catch(() => {});
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  ensureIndexes(db).catch(() => {});
  return { client, db };
}

// ============================================================
// UTILITIES & AUTH HELPERS
// ============================================================
function cleanDoc(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if (!rest.id && _id) rest.id = _id.toString();
  return rest;
}

function slugify(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category';
}

function parseBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function applyCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

function createAccessToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '168h' });
}

function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req: any): any {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.substring(7).trim();
  return verifyAccessToken(token);
}

// ============================================================
// MASTER SERVERLESS HANDLER
// ============================================================
export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  try {
    // 1. Extract clean path
    let rawUrl = req.url || '';
    if (req.query?.path) {
      rawUrl = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    }

    let path = rawUrl.split('?')[0].replace(/^\/api\/?/, '').replace(/^\//, '');

    // 2. Parse query params
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

    // 3. Health & Meta
    if (path === 'health') {
      return res.status(200).json({
        status: 'healthy',
        service: 'aasha-textile-serverless-api',
        timestamp: new Date().toISOString(),
      });
    }

    if (path === 'robots.txt' || rawUrl.includes('robots.txt')) {
      const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/*\nDisallow: /api/*\n\nSitemap: https://aashatextile.com/sitemap.xml\n`;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(robotsTxt);
    }

    if (path === 'sitemap.xml' || rawUrl.includes('sitemap.xml')) {
      const { db } = await connectToDatabase();
      const baseUrl = 'https://aashatextile.com';
      const products = await db.collection('products').find({}, { projection: { id: 1 } }).toArray();
      const categories = await db.collection('categories').find({}, { projection: { name: 1, slug: 1 } }).toArray();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
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
      staticPages.forEach((p) => {
        xml += `  <url><loc>${baseUrl}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`;
      });
      categories.forEach((c) => {
        const slug = c.slug || slugify(c.name);
        xml += `  <url><loc>${baseUrl}/category/${encodeURIComponent(slug)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      });
      products.forEach((p) => {
        xml += `  <url><loc>${baseUrl}/product/${p.id}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
      });
      xml += '</urlset>';
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(xml);
    }

    if (!path || path === '') {
      return res.status(200).json({ message: 'Aasha Textile Serverless API', status: 'active', version: '2.0.0' });
    }

    // Connect to database for API data operations
    const { db } = await connectToDatabase();

    // ============================================================
    // AUTH ROUTES
    // ============================================================
    if (path.startsWith('auth/')) {
      const sub = path.replace(/^auth\//, '');

      if (sub === 'login' && req.method === 'POST') {
        const body = parseBody(req);
        const email = (body.email || '').toLowerCase().trim();
        const password = body.password || '';

        const admin = await db.collection('admins').findOne({ email });
        if (!admin) return res.status(401).json({ detail: 'Invalid email or password' });

        const isValid = await verifyPassword(password, admin.password_hash);
        if (!isValid) return res.status(401).json({ detail: 'Invalid email or password' });

        const token = createAccessToken({ email: admin.email, id: admin.id || admin._id?.toString() });
        return res.status(200).json({ access_token: token, token_type: 'bearer', email: admin.email });
      }

      if (sub === 'me' && req.method === 'GET') {
        const authUser = requireAuth(req);
        if (!authUser) return res.status(401).json({ detail: 'Not authenticated' });
        const admin = await db.collection('admins').findOne({ email: authUser.email });
        if (!admin) return res.status(404).json({ detail: 'Admin not found' });
        return res.status(200).json({ email: admin.email, created_at: admin.created_at });
      }

      if (sub === 'change-password' && req.method === 'POST') {
        const authUser = requireAuth(req);
        if (!authUser) return res.status(401).json({ detail: 'Not authenticated' });
        const body = parseBody(req);
        const { current_password, new_password } = body;
        if (!current_password || !new_password) return res.status(400).json({ detail: 'Passwords required' });

        const admin = await db.collection('admins').findOne({ email: authUser.email });
        if (!admin) return res.status(404).json({ detail: 'Admin not found' });

        const isValid = await verifyPassword(current_password, admin.password_hash);
        if (!isValid) return res.status(400).json({ detail: 'Current password is incorrect' });

        const newHash = await hashPassword(new_password);
        await db.collection('admins').updateOne({ email: authUser.email }, { $set: { password_hash: newHash, updated_at: new Date() } });
        return res.status(200).json({ message: 'Password changed successfully' });
      }
    }

    // ============================================================
    // SETTINGS
    // ============================================================
    if (path === 'settings' || path === 'public/settings') {
      if (req.method === 'GET') {
        let settings = await db.collection('settings').findOne({ _id: 'site_settings' as any });
        if (!settings) settings = await db.collection('settings').findOne({});
        if (!settings) {
          return res.status(200).json({
            store_name: 'Aasha Textile',
            tagline: 'Quality Fabric, Wholesale Price',
            whatsapp: '+919876543210',
            phone: '+919876543210',
          });
        }
        return res.status(200).json(cleanDoc(settings));
      }

      if (req.method === 'PUT') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const body = parseBody(req);
        delete body._id;
        delete body.id;
        body.updated_at = new Date();

        const result = await db.collection('settings').findOneAndUpdate(
          { _id: 'site_settings' as any },
          { $set: body },
          { upsert: true, returnDocument: 'after' }
        );
        return res.status(200).json(cleanDoc(result || body));
      }
    }

    // ============================================================
    // TRACK VISIT
    // ============================================================
    if (path === 'public/track-visit' && req.method === 'POST') {
      const body = parseBody(req);
      await db.collection('visits').insertOne({
        path: body.path || '/',
        referrer: body.referrer || '',
        user_agent: req.headers['user-agent'] || '',
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        timestamp: new Date(),
      });
      return res.status(200).json({ status: 'ok' });
    }

    // ============================================================
    // DROPS
    // ============================================================
    if (path === 'drops' || path.startsWith('drops/') || path === 'public/drops') {
      if (path === 'public/drops') {
        const now = new Date();
        const raw = await db.collection('drops').find({ status: 'active', expiresAt: { $gt: now } }).sort({ addedAt: -1 }).limit(50).toArray();
        const items = raw.map(cleanDoc);
        return res.status(200).json({ items, count: items.length });
      }

      const sub = path.replace(/^drops\/?/, '');
      if (!sub) {
        if (req.method === 'GET') {
          const raw = await db.collection('drops').find({}).sort({ addedAt: -1 }).toArray();
          const items = raw.map(cleanDoc);
          return res.status(200).json({ items, count: items.length });
        }

        if (req.method === 'POST') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          const { youtubeVideoId, youtubeUrl, title, thumbnailUrl } = body;
          let vid = youtubeVideoId;
          if (!vid && youtubeUrl) {
            const match = youtubeUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/watch\?v=|\&v=)([^#\&\?]*).*/);
            vid = match && match[1].length === 11 ? match[1] : youtubeUrl;
          }
          if (!vid) return res.status(400).json({ detail: 'YouTube Video ID or URL required' });

          const existing = await db.collection('drops').findOne({ youtubeVideoId: vid });
          if (existing) return res.status(409).json({ detail: 'Drop already exists for this video' });

          const addedAt = new Date();
          const expiresAt = new Date(addedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
          const dropTitle = title || 'Aasha Textile Video Drop';
          const newDrop = {
            id: crypto.randomUUID(),
            youtubeVideoId: vid,
            youtubeUrl: youtubeUrl || `https://www.youtube.com/watch?v=${vid}`,
            title: dropTitle,
            thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
            publishedAt: addedAt,
            addedAt,
            expiresAt,
            products: [],
            status: 'active',
          };
          await db.collection('drops').insertOne(newDrop);

          // 🎯 1 TEER 2 SHIKAR: Auto-save permanently to 'videos' collection (See Our Collection)
          const formattedDate = addedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const permanentTitle = `${dropTitle}    ${formattedDate}`;
          await db.collection('videos').updateOne(
            { video_id: vid },
            {
              $set: {
                video_id: vid,
                title: permanentTitle,
                thumbnail_url: newDrop.thumbnailUrl,
                sort_order: 0,
                created_at: addedAt,
              },
            },
            { upsert: true }
          );

          return res.status(201).json(cleanDoc(newDrop));
        }
      } else {
        const dropId = sub;
        if (req.method === 'GET') {
          const drop = await db.collection('drops').findOne({ $or: [{ id: dropId }, { youtubeVideoId: dropId }] });
          if (!drop) return res.status(404).json({ detail: 'Drop not found' });
          return res.status(200).json(cleanDoc(drop));
        }
        if (req.method === 'PATCH' || req.method === 'PUT') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          const updateData: any = {};
          if (body.title !== undefined) updateData.title = body.title;
          if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
          if (body.status !== undefined) updateData.status = body.status;
          if (body.products !== undefined) updateData.products = body.products;

          const result = await db.collection('drops').findOneAndUpdate(
            { $or: [{ id: dropId }, { youtubeVideoId: dropId }] },
            { $set: updateData },
            { returnDocument: 'after' }
          );
          if (!result) return res.status(404).json({ detail: 'Drop not found' });

          // Also update permanent video title if title was changed
          if (body.title && (result.youtubeVideoId || dropId)) {
            const vid = result.youtubeVideoId || dropId;
            const dropDate = new Date(result.addedAt || Date.now());
            const formattedDate = dropDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const permanentTitle = `${body.title}    ${formattedDate}`;
            await db.collection('videos').updateOne(
              { video_id: vid },
              { $set: { title: permanentTitle, thumbnail_url: result.thumbnailUrl || `https://img.youtube.com/vi/${vid}/hqdefault.jpg` } },
              { upsert: true }
            );
          }

          return res.status(200).json(cleanDoc(result));
        }
        if (req.method === 'DELETE') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });

          const drop = await db.collection('drops').findOne({ $or: [{ id: dropId }, { youtubeVideoId: dropId }] });
          if (!drop) return res.status(404).json({ detail: 'Drop not found' });

          // Clean up any MongoDB images attached to this drop
          const imageIds: string[] = [];
          (drop.products || []).forEach((p: any) => {
            if (p.imageUrl) {
              const match = p.imageUrl.match(/\/api\/images\/([a-zA-Z0-9-]+)/);
              if (match) imageIds.push(match[1]);
            }
          });
          if (imageIds.length > 0) {
            await db.collection('images').deleteMany({ id: { $in: imageIds } });
          }

          await db.collection('drops').deleteOne({ $or: [{ id: dropId }, { youtubeVideoId: dropId }] });
          return res.status(200).json({ message: 'Drop and associated images deleted successfully' });
        }
      }
    }

    // ============================================================
    // PRODUCTS
    // ============================================================
    if (path === 'products' || path.startsWith('products/') || path === 'public/products' || path.startsWith('public/products/')) {
      const sub = path.replace(/^public\//, '').replace(/^products\/?/, '');

      if (sub === 'bulk-delete' && req.method === 'POST') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const body = parseBody(req);
        const ids = body.ids || [];
        const result = await db.collection('products').deleteMany({ $or: [{ id: { $in: ids } }, { _id: { $in: ids } }] });
        return res.status(200).json({ deleted_count: result.deletedCount });
      }

      if (sub === 'delete-no-images' && req.method === 'POST') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const result = await db.collection('products').deleteMany({
          $or: [{ image_url: { $exists: false } }, { image_url: null }, { image_url: '' }],
        });
        return res.status(200).json({ deleted_count: result.deletedCount });
      }

      if (sub === 'check-duplicates' && req.method === 'GET') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const duplicates = await db.collection('products').aggregate([
          { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$id' } } },
          { $match: { count: { $gt: 1 } } },
        ]).toArray();
        return res.status(200).json({ duplicates, count: duplicates.length });
      }

      if (!sub) {
        if (req.method === 'GET') {
          const filter: any = {};
          if (query.category) filter.category = new RegExp(`^${query.category}$`, 'i');
          if (query.featured !== undefined) filter.is_featured = query.featured === 'true';
          if (query.q) {
            filter.$or = [
              { name: { $regex: query.q, $options: 'i' } },
              { name_en: { $regex: query.q, $options: 'i' } },
              { variety: { $regex: query.q, $options: 'i' } },
              { category: { $regex: query.q, $options: 'i' } },
              { info: { $regex: query.q, $options: 'i' } },
            ];
          }
          const limit = parseInt(query.limit) || 200;
          const skip = parseInt(query.skip) || 0;
          const raw = await db.collection('products').find(filter).sort({ sort_order: 1, created_at: -1 }).skip(skip).limit(limit).toArray();
          const items = raw.map(cleanDoc);
          return res.status(200).json({ items, count: items.length });
        }

        if (req.method === 'POST') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          const newProduct = {
            id: crypto.randomUUID(),
            name: body.name || '',
            name_en: body.name_en || '',
            category: body.category || 'Uncategorized',
            rate: body.rate || '',
            cut: body.cut || '',
            panna: body.panna || '',
            variety: body.variety || '',
            info: body.info || '',
            image_url: body.image_url || '',
            images: body.images || [],
            stock_status: body.stock_status || 'In Stock',
            is_featured: Boolean(body.is_featured),
            sort_order: Number(body.sort_order) || 0,
            created_at: new Date(),
            updated_at: new Date(),
          };
          await db.collection('products').insertOne(newProduct);
          return res.status(201).json(cleanDoc(newProduct));
        }
      } else {
        const prodId = sub;
        if (req.method === 'GET') {
          const product = await db.collection('products').findOne({ $or: [{ id: prodId }, { _id: prodId }] });
          if (!product) return res.status(404).json({ detail: 'Product not found' });
          return res.status(200).json(cleanDoc(product));
        }
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          body.updated_at = new Date();
          delete body._id;
          delete body.id;
          const result = await db.collection('products').findOneAndUpdate(
            { $or: [{ id: prodId }, { _id: prodId }] },
            { $set: body },
            { returnDocument: 'after' }
          );
          if (!result) return res.status(404).json({ detail: 'Product not found' });
          return res.status(200).json(cleanDoc(result));
        }
        if (req.method === 'DELETE') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const result = await db.collection('products').deleteOne({ $or: [{ id: prodId }, { _id: prodId }] });
          if (result.deletedCount === 0) return res.status(404).json({ detail: 'Product not found' });
          return res.status(200).json({ message: 'Product deleted successfully' });
        }
      }
    }

    // ============================================================
    // CATEGORIES
    // ============================================================
    if (path === 'categories' || path.startsWith('categories/')) {
      const sub = path.replace(/^categories\/?/, '');
      if (!sub) {
        if (req.method === 'GET') {
          const explicit = await db.collection('categories').find({}).sort({ sort_order: 1 }).toArray();
          const productCategories = await db.collection('products').aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, sample_image: { $first: '$image_url' } } },
          ]).toArray();

          const explicitMap = new Map();
          explicit.forEach((c) => explicitMap.set(c.name.toLowerCase(), c));
          const merged: any[] = [];
          const seen = new Set();

          explicit.forEach((c) => {
            const key = c.name.toLowerCase();
            const pCat = productCategories.find((p) => (p._id || '').toLowerCase() === key);
            merged.push({ ...cleanDoc(c), product_count: pCat ? pCat.count : 0, virtual: false });
            seen.add(key);
          });

          productCategories.forEach((pCat) => {
            const name = pCat._id;
            if (!name) return;
            const key = name.toLowerCase();
            if (!seen.has(key)) {
              merged.push({
                id: null,
                name,
                slug: slugify(name),
                description: '',
                image_url: pCat.sample_image || '',
                sort_order: 999,
                product_count: pCat.count,
                virtual: true,
              });
              seen.add(key);
            }
          });
          return res.status(200).json({ items: merged, count: merged.length });
        }

        if (req.method === 'POST') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          const name = (body.name || '').trim();
          if (!name) return res.status(400).json({ detail: 'Category name is required' });
          const newCat = {
            id: crypto.randomUUID(),
            name,
            slug: body.slug ? slugify(body.slug) : slugify(name),
            description: body.description || '',
            image_url: body.image_url || '',
            sort_order: Number(body.sort_order) || 0,
            created_at: new Date(),
          };
          await db.collection('categories').insertOne(newCat);
          return res.status(201).json(cleanDoc(newCat));
        }
      } else {
        const catId = sub;
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          delete body._id;
          delete body.id;
          if (body.slug) body.slug = slugify(body.slug);
          const result = await db.collection('categories').findOneAndUpdate(
            { $or: [{ id: catId }, { _id: catId }] },
            { $set: body },
            { returnDocument: 'after' }
          );
          if (!result) return res.status(404).json({ detail: 'Category not found' });
          return res.status(200).json(cleanDoc(result));
        }
        if (req.method === 'DELETE') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const result = await db.collection('categories').deleteOne({ $or: [{ id: catId }, { _id: catId }] });
          if (result.deletedCount === 0) return res.status(404).json({ detail: 'Category not found' });
          return res.status(200).json({ message: 'Category deleted successfully' });
        }
      }
    }

    // ============================================================
    // VIDEOS
    // ============================================================
    if (path === 'videos' || path.startsWith('videos/')) {
      const sub = path.replace(/^videos\/?/, '');
      if (!sub) {
        if (req.method === 'GET') {
          const raw = await db.collection('videos').find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
          const items = raw.map(cleanDoc);
          return res.status(200).json({ items, count: items.length });
        }
        if (req.method === 'POST') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const body = parseBody(req);
          const videoId = (body.video_id || '').trim();
          if (!videoId) return res.status(400).json({ detail: 'video_id is required' });
          const newVideo = {
            id: crypto.randomUUID(),
            video_id: videoId,
            title: body.title || '',
            thumbnail_url: body.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            sort_order: Number(body.sort_order) || 0,
            created_at: new Date(),
          };
          await db.collection('videos').insertOne(newVideo);
          return res.status(201).json(cleanDoc(newVideo));
        }
      } else {
        const vidId = sub;
        if (req.method === 'DELETE') {
          const user = requireAuth(req);
          if (!user) return res.status(401).json({ detail: 'Not authenticated' });
          const result = await db.collection('videos').deleteOne({ $or: [{ id: vidId }, { _id: vidId }] });
          if (result.deletedCount === 0) return res.status(404).json({ detail: 'Video not found' });
          return res.status(200).json({ message: 'Video deleted successfully' });
        }
      }
    }

    // ============================================================
    // TESTIMONIALS
    // ============================================================
    if (path === 'testimonials' || path.startsWith('testimonials/')) {
      const sub = path.replace(/^testimonials\/?/, '');
      if (!sub) {
        const raw = await db.collection('testimonials').find({ is_published: true }).sort({ sort_order: 1, created_at: -1 }).toArray();
        return res.status(200).json({ items: raw.map(cleanDoc), count: raw.length });
      }
      if (sub === 'admin') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        if (req.method === 'GET') {
          const raw = await db.collection('testimonials').find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
          return res.status(200).json({ items: raw.map(cleanDoc), count: raw.length });
        }
        if (req.method === 'POST') {
          const body = parseBody(req);
          const newTestimonial = {
            id: crypto.randomUUID(),
            author_name: body.author_name || 'Customer',
            author_role: body.author_role || '',
            city: body.city || '',
            rating: Number(body.rating) || 5,
            message: body.message || '',
            avatar_url: body.avatar_url || '',
            sort_order: Number(body.sort_order) || 0,
            is_published: body.is_published !== undefined ? Boolean(body.is_published) : true,
            created_at: new Date(),
          };
          await db.collection('testimonials').insertOne(newTestimonial);
          return res.status(201).json(cleanDoc(newTestimonial));
        }
      } else {
        const testId = sub;
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const body = parseBody(req);
          delete body._id;
          delete body.id;
          const result = await db.collection('testimonials').findOneAndUpdate({ $or: [{ id: testId }, { _id: testId }] }, { $set: body }, { returnDocument: 'after' });
          if (!result) return res.status(404).json({ detail: 'Testimonial not found' });
          return res.status(200).json(cleanDoc(result));
        }
        if (req.method === 'DELETE') {
          const result = await db.collection('testimonials').deleteOne({ $or: [{ id: testId }, { _id: testId }] });
          if (result.deletedCount === 0) return res.status(404).json({ detail: 'Testimonial not found' });
          return res.status(200).json({ message: 'Testimonial deleted successfully' });
        }
      }
    }

    // ============================================================
    // REVIEWS
    // ============================================================
    if (path === 'reviews' || path.startsWith('reviews/')) {
      const sub = path.replace(/^reviews\/?/, '');
      if (!sub) {
        if (req.method === 'GET') {
          const raw = await db.collection('reviews').find({ is_approved: true }).sort({ created_at: -1 }).toArray();
          return res.status(200).json({ items: raw.map(cleanDoc), count: raw.length });
        }
        if (req.method === 'POST') {
          const body = parseBody(req);
          const newReview = {
            id: crypto.randomUUID(),
            author_name: body.author_name || 'Customer',
            author_phone: body.author_phone || '',
            city: body.city || '',
            rating: Number(body.rating) || 5,
            message: body.message || '',
            is_approved: false,
            created_at: new Date(),
          };
          await db.collection('reviews').insertOne(newReview);
          return res.status(201).json(cleanDoc(newReview));
        }
      }
      if (sub === 'admin') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const raw = await db.collection('reviews').find({}).sort({ created_at: -1 }).toArray();
        return res.status(200).json({ items: raw.map(cleanDoc), count: raw.length });
      }
      const reviewId = sub;
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });
      if (req.method === 'PATCH' || req.method === 'PUT') {
        const body = parseBody(req);
        delete body._id;
        delete body.id;
        const result = await db.collection('reviews').findOneAndUpdate({ $or: [{ id: reviewId }, { _id: reviewId }] }, { $set: body }, { returnDocument: 'after' });
        if (!result) return res.status(404).json({ detail: 'Review not found' });
        return res.status(200).json(cleanDoc(result));
      }
      if (req.method === 'DELETE') {
        const result = await db.collection('reviews').deleteOne({ $or: [{ id: reviewId }, { _id: reviewId }] });
        if (result.deletedCount === 0) return res.status(404).json({ detail: 'Review not found' });
        return res.status(200).json({ message: 'Review deleted successfully' });
      }
    }

    // ============================================================
    // IMAGES
    // ============================================================
    if (path.startsWith('images/')) {
      const sub = path.replace(/^images\//, '');
      if (sub === 'upload' && req.method === 'POST') {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ detail: 'Not authenticated' });
        const body = parseBody(req);
        let { data, filename, content_type } = body;
        if (!data) return res.status(400).json({ detail: 'No image data provided' });

        if (data.startsWith('data:')) {
          const match = data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            content_type = content_type || match[1];
            data = match[2];
          }
        }
        const imageId = crypto.randomUUID();
        const doc: any = {
          id: imageId,
          filename: filename || `image-${imageId}.jpg`,
          content_type: content_type || 'image/jpeg',
          data,
          created_at: new Date(),
        };

        // If uploaded as a drop product image, set 5-day auto-expiry
        if (body.is_drop_image || body.expires_in_days || query.is_drop_image) {
          const days = Number(body.expires_in_days) || 5;
          doc.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }

        await db.collection('images').insertOne(doc);
        return res.status(200).json({ id: imageId, url: `/api/images/${imageId}`, filename: doc.filename });
      }

      const imgId = sub;
      if (imgId && req.method === 'GET') {
        const cleanId = imgId.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        const imgDoc = await db.collection('images').findOne({ $or: [{ id: cleanId }, { id: imgId }] });
        if (!imgDoc || !imgDoc.data) return res.status(404).json({ detail: 'Image not found' });

        const buffer = Buffer.from(imgDoc.data, 'base64');
        res.setHeader('Content-Type', imgDoc.content_type || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(buffer);
      }
    }

    // ============================================================
    // DASHBOARD STATS
    // ============================================================
    if (path === 'dashboard/stats') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const totalProducts = await db.collection('products').countDocuments();
      const activeProducts = await db.collection('products').countDocuments({ stock_status: 'In Stock' });
      const outOfStock = await db.collection('products').countDocuments({ stock_status: 'Out of Stock' });
      const featuredProducts = await db.collection('products').countDocuments({ is_featured: true });
      const totalCategories = await db.collection('categories').countDocuments();
      const totalVideos = await db.collection('videos').countDocuments();
      const totalDrops = await db.collection('drops').countDocuments({ status: 'active' });
      const totalTestimonials = await db.collection('testimonials').countDocuments();
      const totalReviews = await db.collection('reviews').countDocuments();
      const totalPageviews = await db.collection('visits').countDocuments();

      const categoryBreakdown = await db.collection('products').aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();

      const byCategory = categoryBreakdown.map((c) => ({
        name: c._id || 'Uncategorized',
        count: c.count || 0,
      }));

      const recentProducts = await db.collection('products').find({}).sort({ created_at: -1 }).limit(5).toArray();

      // Today's visitors
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayVisitorsList = await db.collection('visits').distinct('ip', { timestamp: { $gte: startOfToday } });
      const todayVisitors = todayVisitorsList.length || 0;

      // Last 7 days daily stats
      const dailyStats: Array<{ name: string; pageviews: number; visitors: number }> = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const pageviews = await db.collection('visits').countDocuments({
          timestamp: { $gte: dayStart, $lte: dayEnd },
        });
        const visitorsList = await db.collection('visits').distinct('ip', {
          timestamp: { $gte: dayStart, $lte: dayEnd },
        });

        dailyStats.push({
          name: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          pageviews: pageviews || 0,
          visitors: visitorsList.length || 0,
        });
      }

      return res.status(200).json({
        total_products: totalProducts,
        featured: featuredProducts,
        featured_products: featuredProducts,
        in_stock: activeProducts,
        active_products: activeProducts,
        out_of_stock: outOfStock,
        total_videos: totalVideos,
        total_categories: totalCategories,
        total_drops: totalDrops,
        total_testimonials: totalTestimonials,
        total_reviews: totalReviews,
        total_pageviews: totalPageviews,
        total_visits: totalPageviews,
        today_visitors: todayVisitors,
        by_category: byCategory,
        category_breakdown: byCategory,
        recent_products: recentProducts.map(cleanDoc),
        daily_stats: dailyStats,
      });
    }

    return res.status(404).json({ error: `API route not found: /api/${path}` });
  } catch (err: any) {
    console.error('Serverless API Error:', err);
    return res.status(500).json({
      error: 'Serverless API Error',
      detail: err?.message || String(err),
    });
  }
}
