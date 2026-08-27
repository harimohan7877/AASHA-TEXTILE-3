import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);
    const { db } = await connectToDatabase();

    const query = {
      $or: [
        { image_url: null },
        { image_url: '' },
        { image_url: 'None' },
        { image_url: { $exists: false } },
      ],
    };

    const resDel = await db.collection('products').deleteMany(query);
    return res.status(200).json({ ok: true, count: resDel.deletedCount });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Delete failed' });
  }
}
