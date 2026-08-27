import { connectToDatabase } from '../_lib/mongodb';
import { applyCors, parseBody } from '../_lib/utils';
import { randomUUID, createHash } from 'crypto';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(req);
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const ip_hash = createHash('md5').update(clientIp).digest('hex');

    const now = new Date();
    const doc = {
      id: randomUUID(),
      path: body.path || '/',
      referrer: body.referrer || '',
      ip_hash,
      created_at: now,
      date: now.toISOString().slice(0, 10),
    };

    const { db } = await connectToDatabase();
    await db.collection('visits').insertOne(doc);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Tracking failed' });
  }
}
