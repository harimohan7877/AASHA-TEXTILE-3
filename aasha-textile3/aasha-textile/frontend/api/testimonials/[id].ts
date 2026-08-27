import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Testimonial ID is required' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const existing = await db.collection('testimonials').findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Testimonial not found' });
      }

      const body = await parseBody(req);
      const updates: Record<string, any> = {};

      if (body.author_name !== undefined) updates.author_name = body.author_name;
      if (body.city !== undefined) updates.city = body.city;
      if (body.author_role !== undefined) updates.author_role = body.author_role;
      if (body.rating !== undefined) updates.rating = body.rating;
      if (body.message !== undefined) updates.message = body.message;
      if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
      if (body.is_published !== undefined) updates.is_published = body.is_published;

      updates.updated_at = new Date();

      await db.collection('testimonials').updateOne({ id }, { $set: updates });
      const doc = await db.collection('testimonials').findOne({ id });
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      verifyAdminToken(req);
      const resDel = await db.collection('testimonials').deleteOne({ id });
      if (resDel.deletedCount === 0) {
        return res.status(404).json({ detail: 'Testimonial not found' });
      }
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
