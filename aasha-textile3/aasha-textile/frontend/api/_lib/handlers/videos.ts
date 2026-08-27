import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleVideos(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const raw = await db.collection('videos').find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
    }

    if (req.method === 'POST') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      const videoId = (body.video_id || '').trim();
      if (!videoId) return res.status(400).json({ detail: 'video_id is required' });

      const newVideo = {
        id: crypto.randomUUID(),
        video_id: videoId,
        title: body.title || '',
        thumbnail_url: body.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        sort_order: Number(body.sort_order) || 0,
        created_at: new Date(),
      };

      await db.collection('videos').insertOne(newVideo);
      return res.status(201).json(cleanDoc(newVideo));
    }
  }

  const vidId = subPath;
  if (vidId && req.method === 'DELETE') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const result = await db.collection('videos').deleteOne({
      $or: [{ id: vidId }, { _id: vidId }],
    });

    if (result.deletedCount === 0) return res.status(404).json({ detail: 'Video not found' });
    return res.status(200).json({ message: 'Video deleted successfully' });
  }

  return res.status(404).json({ error: 'Videos route not found' });
}
