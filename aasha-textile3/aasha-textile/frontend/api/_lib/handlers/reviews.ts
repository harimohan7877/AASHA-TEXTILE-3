import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleReviews(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // /api/reviews
  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const raw = await db.collection('reviews').find({ is_approved: true }).sort({ created_at: -1 }).toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
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

  // /api/reviews/admin
  if (subPath === 'admin') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    if (req.method === 'GET') {
      const raw = await db.collection('reviews').find({}).sort({ created_at: -1 }).toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
    }
  }

  // /api/reviews/:id
  const reviewId = subPath;
  if (reviewId && reviewId !== 'admin') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = parseBody(req);
      delete body._id;
      delete body.id;

      const result = await db.collection('reviews').findOneAndUpdate(
        { $or: [{ id: reviewId }, { _id: reviewId }] },
        { $set: body },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ detail: 'Review not found' });
      return res.status(200).json(cleanDoc(result));
    }

    if (req.method === 'DELETE') {
      const result = await db.collection('reviews').deleteOne({
        $or: [{ id: reviewId }, { _id: reviewId }],
      });

      if (result.deletedCount === 0) return res.status(404).json({ detail: 'Review not found' });
      return res.status(200).json({ message: 'Review deleted successfully' });
    }
  }

  return res.status(404).json({ error: 'Reviews route not found' });
}
