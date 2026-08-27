import { connectToDatabase } from './_lib/mongodb';
import { verifyAdminToken, ensureAdminAndSettings } from './_lib/auth';
import { applyCors, cleanDoc, parseBody } from './_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();
  await ensureAdminAndSettings(db);

  if (req.method === 'GET') {
    const s = await db.collection('settings').findOne({ key: 'site' });
    return res.status(200).json(cleanDoc(s) || {});
  }

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const body = await parseBody(req);
      const updates: Record<string, any> = { ...body };
      delete updates._id;
      delete updates.key;
      updates.updated_at = new Date();

      await db.collection('settings').updateOne(
        { key: 'site' },
        { $set: updates },
        { upsert: true }
      );

      const s = await db.collection('settings').findOne({ key: 'site' });
      return res.status(200).json(cleanDoc(s));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
