import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);
    const body = await parseBody(req);
    const urls: string[] = body.urls || [];

    if (!urls || urls.length === 0) {
      return res.status(200).json({ existing_urls: [] });
    }

    const { db } = await connectToDatabase();
    const cursor = db.collection('products').find(
      {
        $or: [{ image_url: { $in: urls } }, { images: { $in: urls } }],
      },
      { projection: { image_url: 1, images: 1 } }
    );

    const matched = await cursor.toArray();
    const existingSet = new Set<string>();

    for (const doc of matched) {
      if (doc.image_url) existingSet.add(doc.image_url);
      if (Array.isArray(doc.images)) {
        for (const img of doc.images) {
          if (img) existingSet.add(img);
        }
      }
    }

    return res.status(200).json({ existing_urls: Array.from(existingSet) });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Check duplicates failed' });
  }
}
