import { connectToDatabase } from '../_lib/mongodb';
import { ensureAdminAndSettings } from '../_lib/auth';
import { applyCors, cleanDoc } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    await ensureAdminAndSettings(db);
    const s = await db.collection('settings').findOne({ key: 'site' });
    return res.status(200).json(cleanDoc(s) || {});
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Error fetching settings' });
  }
}
