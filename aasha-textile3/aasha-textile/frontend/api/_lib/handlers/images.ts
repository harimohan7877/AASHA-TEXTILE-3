import { connectToDatabase } from '../mongodb';
import { applyCors, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleImages(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // POST /api/images/upload
  if (subPath === 'upload' && req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const body = parseBody(req);
    let { data, filename, content_type } = body;

    if (!data) return res.status(400).json({ detail: 'No image data provided' });

    if (data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        content_type = content_type || match[1];
        data = match[2];
      }
    }

    const imageId = crypto.randomUUID();
    const doc = {
      id: imageId,
      filename: filename || `image-${imageId}.jpg`,
      content_type: content_type || 'image/jpeg',
      data,
      created_at: new Date(),
    };

    await db.collection('images').insertOne(doc);
    return res.status(200).json({
      id: imageId,
      url: `/api/images/${imageId}`,
      filename: doc.filename,
    });
  }

  // GET /api/images/:id
  const imgId = subPath;
  if (imgId && req.method === 'GET') {
    const cleanId = imgId.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
    const imgDoc = await db.collection('images').findOne({
      $or: [{ id: cleanId }, { id: imgId }],
    });

    if (!imgDoc || !imgDoc.data) {
      return res.status(404).json({ detail: 'Image not found' });
    }

    const buffer = Buffer.from(imgDoc.data, 'base64');
    res.setHeader('Content-Type', imgDoc.content_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  }

  return res.status(404).json({ error: 'Images route not found' });
}
