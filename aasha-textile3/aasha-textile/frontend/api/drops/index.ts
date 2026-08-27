import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, parseBody } from '../_lib/utils';
import { randomUUID } from 'crypto';

function extractVideoId(input: string): string {
  const m1 = input.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (m1) return m1[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return input.trim();
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();
  const dropsCol = db.collection('drops');

  if (req.method === 'GET') {
    const raw = await dropsCol
      .find({ status: 'active' })
      .sort({ addedAt: -1 })
      .limit(100)
      .toArray();

    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  }

  if (req.method === 'POST') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);

      const videoInput = body.youtubeUrl || body.youtubeVideoId || '';
      const videoId = extractVideoId(videoInput);

      if (!videoId) {
        return res.status(400).json({ detail: 'Valid YouTube Video ID or URL is required' });
      }

      const existing = await dropsCol.findOne({ youtubeVideoId: videoId, status: 'active' });
      if (existing) {
        return res.status(400).json({ detail: 'An active Drop for this YouTube video already exists' });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

      const doc = {
        id: randomUUID(),
        youtubeVideoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: body.title || 'New Video Drop',
        thumbnailUrl: body.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : now,
        addedAt: now,
        expiresAt,
        products: body.products || [],
        status: 'active',
      };

      await dropsCol.insertOne(doc);
      return res.status(201).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Create Drop failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
