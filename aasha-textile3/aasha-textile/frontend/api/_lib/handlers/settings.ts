import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';

export async function handleSettings(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // GET /api/settings or GET /api/public/settings
  if (req.method === 'GET') {
    let settings = await db.collection('settings').findOne({ _id: 'site_settings' as any });
    if (!settings) {
      settings = await db.collection('settings').findOne({});
    }

    if (!settings) {
      return res.status(200).json({
        store_name: 'Aasha Textile',
        tagline: 'Quality Fabric, Wholesale Price',
        whatsapp: '+919876543210',
        phone: '+919876543210',
      });
    }

    return res.status(200).json(cleanDoc(settings));
  }

  // PUT /api/settings (Admin only)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const body = parseBody(req);
    delete body._id;
    delete body.id;
    body.updated_at = new Date();

    const result = await db.collection('settings').findOneAndUpdate(
      { _id: 'site_settings' as any },
      { $set: body },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json(cleanDoc(result || body));
  }

  return res.status(404).json({ error: 'Settings route not found' });
}
