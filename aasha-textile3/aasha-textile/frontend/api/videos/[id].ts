import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Video ID is required' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const existing = await db.collection('videos').findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Video not found' });
      }

      const body = await parseBody(req);
      const updates: Record<string, any> = {};

      if (body.video_id !== undefined && body.video_id !== existing.video_id) {
        const dupe = await db.collection('videos').findOne({ video_id: body.video_id });
        if (dupe) {
          return res.status(400).json({ detail: 'Another video with this video_id already exists' });
        }
        updates.video_id = body.video_id;
      }

      if (body.title !== undefined) updates.title = body.title;
      if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

      updates.updated_at = new Date();

      await db.collection('videos').updateOne({ id }, { $set: updates });
      const doc = await db.collection('videos').findOne({ id });
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      verifyAdminToken(req);
      const resDel = await db.collection('videos').deleteOne({ id });
      if (resDel.deletedCount === 0) {
        return res.status(404).json({ detail: 'Video not found' });
      }
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
