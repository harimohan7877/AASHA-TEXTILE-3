import { connectToDatabase } from '../../_lib/mongodb';
import { applyCors, cleanDoc } from '../../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const now = new Date();

    // Query active drops that have not passed expiration
    const raw = await db
      .collection('drops')
      .find({
        status: 'active',
        expiresAt: { $gt: now },
      })
      .sort({ addedAt: -1 })
      .limit(50)
      .toArray();

    const items = raw.map(cleanDoc);
    return res.status(200).json({ items, count: items.length });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Error fetching drops' });
  }
}
