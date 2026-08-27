import { connectToDatabase } from '../../_lib/mongodb';
import { applyCors, cleanDoc } from '../../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Product ID is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection('products').findOne({ id });

    if (!doc) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    return res.status(200).json(cleanDoc(doc));
  } catch (err: any) {
    return res.status(500).json({ detail: err.message || 'Error fetching product' });
  }
}
