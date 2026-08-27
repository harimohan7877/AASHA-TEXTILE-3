import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleTestimonials(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // Public list: GET /api/testimonials
  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const raw = await db
        .collection('testimonials')
        .find({ is_published: true })
        .sort({ sort_order: 1, created_at: -1 })
        .toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
    }
  }

  // Admin list & create: /api/testimonials/admin
  if (subPath === 'admin') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    if (req.method === 'GET') {
      const raw = await db.collection('testimonials').find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
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
  }

  // /api/testimonials/:id
  const testId = subPath;
  if (testId && testId !== 'admin') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = parseBody(req);
      delete body._id;
      delete body.id;

      const result = await db.collection('testimonials').findOneAndUpdate(
        { $or: [{ id: testId }, { _id: testId }] },
        { $set: body },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ detail: 'Testimonial not found' });
      return res.status(200).json(cleanDoc(result));
    }

    if (req.method === 'DELETE') {
      const result = await db.collection('testimonials').deleteOne({
        $or: [{ id: testId }, { _id: testId }],
      });

      if (result.deletedCount === 0) return res.status(404).json({ detail: 'Testimonial not found' });
      return res.status(200).json({ message: 'Testimonial deleted successfully' });
    }
  }

  return res.status(404).json({ error: 'Testimonials route not found' });
}
