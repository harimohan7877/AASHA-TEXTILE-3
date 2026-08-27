import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleDrops(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // Public drops: GET /api/public/drops or GET /api/drops (public)
  if (subPath === 'public' || subPath === 'public/drops') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const now = new Date();
    const raw = await db
      .collection('drops')
      .find({ status: 'active', expiresAt: { $gt: now } })
      .sort({ addedAt: -1 })
      .limit(50)
      .toArray();
    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  }

  // Admin drops root: /api/drops
  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const raw = await db.collection('drops').find({}).sort({ addedAt: -1 }).toArray();
      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
    }

    if (req.method === 'POST') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      const { youtubeVideoId, youtubeUrl, title, thumbnailUrl } = body;
      if (!youtubeVideoId && !youtubeUrl) {
        return res.status(400).json({ detail: 'YouTube Video ID or URL is required' });
      }

      let vid = youtubeVideoId;
      if (!vid && youtubeUrl) {
        const match = youtubeUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/watch\?v=|\&v=)([^#\&\?]*).*/);
        vid = match && match[1].length === 11 ? match[1] : youtubeUrl;
      }

      const existing = await db.collection('drops').findOne({ youtubeVideoId: vid });
      if (existing) {
        return res.status(409).json({ detail: 'Drop already exists for this YouTube video' });
      }

      const addedAt = new Date();
      const expiresAt = new Date(addedAt.getTime() + 5 * 24 * 60 * 60 * 1000);

      const newDrop = {
        id: crypto.randomUUID(),
        youtubeVideoId: vid,
        youtubeUrl: youtubeUrl || `https://www.youtube.com/watch?v=${vid}`,
        title: title || 'Aasha Textile Video Drop',
        thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        publishedAt: addedAt,
        addedAt,
        expiresAt,
        products: [],
        status: 'active',
      };

      await db.collection('drops').insertOne(newDrop);
      return res.status(201).json(cleanDoc(newDrop));
    }
  }

  // Drop with ID: /api/drops/:id
  const dropId = subPath;
  if (dropId) {
    if (req.method === 'GET') {
      const drop = await db.collection('drops').findOne({
        $or: [{ id: dropId }, { youtubeVideoId: dropId }],
      });
      if (!drop) return res.status(404).json({ detail: 'Drop not found' });
      return res.status(200).json(cleanDoc(drop));
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      const updateData: any = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.products !== undefined) updateData.products = body.products;

      const result = await db.collection('drops').findOneAndUpdate(
        { $or: [{ id: dropId }, { youtubeVideoId: dropId }] },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ detail: 'Drop not found' });
      return res.status(200).json(cleanDoc(result));
    }

    if (req.method === 'DELETE') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const result = await db.collection('drops').deleteOne({
        $or: [{ id: dropId }, { youtubeVideoId: dropId }],
      });

      if (result.deletedCount === 0) return res.status(404).json({ detail: 'Drop not found' });
      return res.status(200).json({ message: 'Drop deleted successfully' });
    }
  }

  return res.status(404).json({ error: 'Drops route not found' });
}
