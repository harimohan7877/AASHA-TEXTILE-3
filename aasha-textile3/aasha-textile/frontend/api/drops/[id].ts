import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Drop ID is required' });
  }

  const { db } = await connectToDatabase();
  const dropsCol = db.collection('drops');

  if (req.method === 'GET') {
    const doc = await dropsCol.findOne({ id });
    if (!doc) {
      return res.status(404).json({ detail: 'Drop not found' });
    }
    return res.status(200).json(cleanDoc(doc));
  }

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const existing = await dropsCol.findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Drop not found' });
      }

      const body = await parseBody(req);
      const updates: Record<string, any> = {};

      if (body.title !== undefined) updates.title = body.title;
      if (body.thumbnailUrl !== undefined) updates.thumbnailUrl = body.thumbnailUrl;
      if (body.products !== undefined) updates.products = body.products;
      if (body.status !== undefined) updates.status = body.status;

      updates.updatedAt = new Date();

      await dropsCol.updateOne({ id }, { $set: updates });
      const updated = await dropsCol.findOne({ id });
      return res.status(200).json(cleanDoc(updated));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update Drop failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      verifyAdminToken(req);
      // Delete document completely (or mark as deleted_manually and delete)
      const resDel = await dropsCol.deleteOne({ id });
      if (resDel.deletedCount === 0) {
        return res.status(404).json({ detail: 'Drop not found' });
      }
      return res.status(200).json({ ok: true, message: 'Drop deleted successfully' });
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Delete Drop failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
