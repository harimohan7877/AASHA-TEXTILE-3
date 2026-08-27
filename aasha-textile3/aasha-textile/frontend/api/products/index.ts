import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, escapeRegex, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const { q, category, stock_status, is_featured, sort, limit = 500, page = 1, per_page } = req.query;

    const query: Record<string, any> = {};
    if (q) {
      const escaped = escapeRegex(String(q));
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { name_en: { $regex: escaped, $options: 'i' } },
        { variety: { $regex: escaped, $options: 'i' } },
        { info: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (stock_status) query.stock_status = stock_status;
    if (is_featured !== undefined) query.is_featured = is_featured === 'true';

    let sortSpec: any = { sort_order: -1, created_at: -1 };
    if (sort === 'newest') sortSpec = { created_at: -1 };
    else if (sort === 'name') sortSpec = { name: 1 };

    const effectiveLimit = per_page ? parseInt(String(per_page), 10) : parseInt(String(limit), 10);
    const currentPage = parseInt(String(page), 10) || 1;
    const skip = (currentPage - 1) * effectiveLimit;

    const total = await db.collection('products').countDocuments(query);
    const pages = Math.ceil(total / effectiveLimit) || 1;

    const raw = await db
      .collection('products')
      .find(query)
      .sort(sortSpec)
      .skip(skip)
      .limit(effectiveLimit)
      .toArray();

    const items = raw.map(cleanDoc);
    return res.status(200).json({
      items,
      count: items.length,
      pagination: {
        page: currentPage,
        per_page: effectiveLimit,
        total,
        pages,
      },
    });
  }

  if (req.method === 'POST') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);

      if (!body.name) {
        return res.status(400).json({ detail: 'Product name is required' });
      }

      const now = new Date();
      const doc = {
        id: randomUUID(),
        name: body.name,
        name_en: body.name_en || null,
        variety: body.variety || null,
        rate: body.rate || null,
        cut: body.cut || null,
        panna: body.panna || null,
        info: body.info || null,
        image_url: body.image_url || null,
        images: body.images || [],
        category: body.category || 'Other',
        stock_status: body.stock_status || 'available',
        is_featured: Boolean(body.is_featured),
        sort_order: Number(body.sort_order || 0),
        created_at: now,
        updated_at: now,
      };

      await db.collection('products').insertOne(doc);
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Create product failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
