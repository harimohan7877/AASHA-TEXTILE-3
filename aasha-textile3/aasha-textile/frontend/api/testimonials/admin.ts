import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);
    const { db } = await connectToDatabase();
    const raw = await db
      .collection('testimonials')
      .find({})
      .sort({ sort_order: -1, created_at: -1 })
      .limit(500)
      .toArray();
    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  } catch (err: any) {
    return res.status(err.status || 401).json({ detail: err.message || 'Unauthorized' });
  }
}
