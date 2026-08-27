import { connectToDatabase } from '../_lib/mongodb';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const { product_id, approved_only } = req.query;
    const query: Record<string, any> = {};

    if (product_id) query.product_id = product_id;
    if (approved_only !== 'false') query.is_approved = true;

    const raw = await db
      .collection('reviews')
      .find(query)
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.product_id || !body.author_name || !body.message || !body.rating) {
        return res.status(400).json({ detail: 'Missing required review fields' });
      }

      const now = new Date();
      const doc = {
        id: randomUUID(),
        product_id: body.product_id,
        author_name: body.author_name,
        author_email: body.author_email || null,
        rating: Number(body.rating),
        message: body.message,
        city: body.city || null,
        is_approved: false,
        created_at: now,
        updated_at: now,
      };

      await db.collection('reviews').insertOne(doc);
      return res.status(200).json({
        ok: true,
        message: 'Review submitted! It will be visible after admin approval.',
      });
    } catch (err: any) {
      return res.status(500).json({ detail: err.message || 'Review submission failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
