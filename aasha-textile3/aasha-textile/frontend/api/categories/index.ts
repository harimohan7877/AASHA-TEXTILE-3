import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, slugify, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const rawCategories = await db
      .collection('categories')
      .find({})
      .sort({ sort_order: -1, name: 1 })
      .toArray();
    const items = rawCategories.map(cleanDoc);

    // Dynamic counts from products
    const pipeline = [{ $group: { _id: '$category', count: { $sum: 1 } } }];
    const countsAgg = await db.collection('products').aggregate(pipeline).toArray();
    const counts: Record<string, number> = {};
    for (const r of countsAgg) {
      if (r._id) counts[r._id] = r.count;
    }

    const knownNames = new Set(items.map((c) => c.name));
    for (const [name, cnt] of Object.entries(counts)) {
      if (name && !knownNames.has(name)) {
        items.push({
          id: null,
          name,
          slug: slugify(name),
          description: null,
          image_url: null,
          sort_order: 0,
          virtual: true,
          product_count: cnt,
        });
      }
    }

    for (const it of items) {
      if (it.product_count === undefined) {
        it.product_count = counts[it.name] || 0;
      }
    }

    return res.status(200).json({ items, count: items.length });
  }

  if (req.method === 'POST') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);
      if (!body.name) {
        return res.status(400).json({ detail: 'Category name is required' });
      }

      const slug = body.slug || slugify(body.name);
      const existing = await db.collection('categories').findOne({
        $or: [{ name: body.name }, { slug }],
      });
      if (existing) {
        return res.status(400).json({ detail: 'Category already exists' });
      }

      const now = new Date();
      const doc = {
        id: randomUUID(),
        name: body.name,
        slug,
        description: body.description || null,
        image_url: body.image_url || null,
        sort_order: body.sort_order || 0,
        created_at: now,
        updated_at: now,
      };

      await db.collection('categories').insertOne(doc);
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Create category failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
