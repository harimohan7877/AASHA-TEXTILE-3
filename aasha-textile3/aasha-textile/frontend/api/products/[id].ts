import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Product ID is required' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const doc = await db.collection('products').findOne({ id });
    if (!doc) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    return res.status(200).json(cleanDoc(doc));
  }

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const existing = await db.collection('products').findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Product not found' });
      }

      const body = await parseBody(req);
      const updates: Record<string, any> = {};

      const fields = [
        'name',
        'name_en',
        'variety',
        'rate',
        'cut',
        'panna',
        'info',
        'image_url',
        'images',
        'category',
        'stock_status',
        'is_featured',
        'sort_order',
      ];

      for (const f of fields) {
        if (body[f] !== undefined) {
          updates[f] = body[f];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(200).json(cleanDoc(existing));
      }

      updates.updated_at = new Date();

      await db.collection('products').updateOne({ id }, { $set: updates });
      const doc = await db.collection('products').findOne({ id });
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      verifyAdminToken(req);
      const resDel = await db.collection('products').deleteOne({ id });
      if (resDel.deletedCount === 0) {
        return res.status(404).json({ detail: 'Product not found' });
      }
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
