import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc, slugify, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ detail: 'Category ID is required' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'PATCH') {
    try {
      verifyAdminToken(req);
      const existing = await db.collection('categories').findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Category not found' });
      }

      const body = await parseBody(req);
      const updates: Record<string, any> = {};

      if (body.name !== undefined) {
        updates.name = body.name;
        // Rename category on attached products
        if (body.name !== existing.name) {
          await db.collection('products').updateMany(
            { category: existing.name },
            { $set: { category: body.name } }
          );
        }
      }

      if (body.slug !== undefined) updates.slug = slugify(body.slug);
      if (body.description !== undefined) updates.description = body.description;
      if (body.image_url !== undefined) updates.image_url = body.image_url;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

      updates.updated_at = new Date();

      await db.collection('categories').updateOne({ id }, { $set: updates });
      const doc = await db.collection('categories').findOne({ id });
      return res.status(200).json(cleanDoc(doc));
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      verifyAdminToken(req);
      const existing = await db.collection('categories').findOne({ id });
      if (!existing) {
        return res.status(404).json({ detail: 'Category not found' });
      }

      // Reset products category to "Other"
      await db.collection('products').updateMany(
        { category: existing.name },
        { $set: { category: 'Other' } }
      );
      await db.collection('categories').deleteOne({ id });

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(err.status || 500).json({ detail: err.message || 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
