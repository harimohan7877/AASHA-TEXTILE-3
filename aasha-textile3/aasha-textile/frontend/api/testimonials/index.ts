import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const raw = await db
      .collection('testimonials')
      .find({ is_published: true })
      .sort({ sort_order: -1, created_at: -1 })
      .limit(500)
      .toArray();
    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  }

  if (req.method === 'POST') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);

      if (!body.author_name || !body.message) {
        return res.status(400).json({ detail: 'author_name and message are required' });
      }

      const now = new Date();
      const doc = {
        id: randomUUID(),
        author_name: body.author_name,
        city: body.city || null,
        author_role: body.author_role || null,
        rating: body.rating !== undefined ? body.rating : 5,
        message: body.message,
        avatar_url: body.avatar_url || null,
        sort_order: body.sort_order || 0,
        is_published: body.is_published !== undefined ? body.is_published : true,
        created_at: now,
        updated_at: now,
      };

      await db.collection('testimonials').insertOne(doc);
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Create testimonial failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
