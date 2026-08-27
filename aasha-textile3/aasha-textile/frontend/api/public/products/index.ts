import { connectToDatabase } from '../../_lib/mongodb';
import { applyCors, cleanDoc, escapeRegex } from '../../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, featured, limit = 500, q, page = 1, per_page } = req.query;

    const query: Record<string, any> = {};
    if (category) query.category = category;
    if (featured !== undefined) query.is_featured = featured === 'true';

    if (q) {
      const escaped = escapeRegex(String(q));
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { name_en: { $regex: escaped, $options: 'i' } },
        { variety: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ];
    }

    const effectiveLimit = per_page ? parseInt(String(per_page), 10) : parseInt(String(limit), 10);
    const currentPage = parseInt(String(page), 10) || 1;

    if (effectiveLimit === 0) {
      return res.status(200).json({
        items: [],
        pagination: { page: 1, per_page: 20, total: 0, pages: 0 },
      });
    }

    const { db } = await connectToDatabase();
    const skip = (currentPage - 1) * effectiveLimit;
    const total = await db.collection('products').countDocuments(query);
    const pages = Math.ceil(total / effectiveLimit) || 1;

    const raw = await db
      .collection('products')
      .find(query)
      .sort({ sort_order: -1, created_at: -1 })
      .skip(skip)
      .limit(effectiveLimit)
      .toArray();

    const items = raw.map(cleanDoc);
    return res.status(200).json({
      items,
      pagination: {
        page: currentPage,
        per_page: effectiveLimit,
        total,
        pages,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Error fetching public products' });
  }
}
