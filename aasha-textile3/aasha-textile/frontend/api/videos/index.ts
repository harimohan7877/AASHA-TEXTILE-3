import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const rawVideos = await db
      .collection('videos')
      .find({})
      .sort({ sort_order: -1, created_at: -1 })
      .limit(500)
      .toArray();
    const items = rawVideos.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  }

  if (req.method === 'POST') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);

      if (!body.video_id || !body.title) {
        return res.status(400).json({ detail: 'video_id and title are required' });
      }

      const existing = await db.collection('videos').findOne({ video_id: body.video_id });
      if (existing) {
        return res.status(400).json({ detail: 'Video with this video_id already exists' });
      }

      const now = new Date();
      const doc = {
        id: randomUUID(),
        video_id: body.video_id,
        title: body.title,
        thumbnail_url: body.thumbnail_url || `https://i.ytimg.com/vi/${body.video_id}/hqdefault.jpg`,
        sort_order: body.sort_order || 0,
        created_at: now,
        updated_at: now,
      };

      await db.collection('videos').insertOne(doc);
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Create video failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
