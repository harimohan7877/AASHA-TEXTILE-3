import { connectToDatabase } from '../_lib/mongodb';
import { applyCors } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Image ID required' });
  }

  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection('images').findOne({ id });

    if (!doc || !doc.data) {
      return res.status(404).json({ detail: 'Image not found' });
    }

    const imageBuffer = Buffer.from(doc.data, 'base64');
    res.setHeader('Content-Type', doc.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(imageBuffer);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Error serving image' });
  }
}
