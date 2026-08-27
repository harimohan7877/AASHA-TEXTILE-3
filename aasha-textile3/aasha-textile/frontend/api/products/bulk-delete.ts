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
    const ids = Array.isArray(body) ? body : body.ids;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ detail: 'No product IDs provided' });
    }

    const { db } = await connectToDatabase();
    const resDel = await db.collection('products').deleteMany({ id: { $in: ids } });

    return res.status(200).json({ ok: true, count: resDel.deletedCount });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Bulk delete failed' });
  }
}
