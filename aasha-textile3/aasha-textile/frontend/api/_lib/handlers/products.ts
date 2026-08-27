import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleProducts(req: any, res: any, subPath: string, query: any) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // /api/products/bulk-delete
  if (subPath === 'bulk-delete' && req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const body = parseBody(req);
    const ids = body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ detail: 'ids array is required' });
    }

    const result = await db.collection('products').deleteMany({
      $or: [{ id: { $in: ids } }, { _id: { $in: ids } }],
    });
    return res.status(200).json({ deleted_count: result.deletedCount });
  }

  // /api/products/delete-no-images
  if (subPath === 'delete-no-images' && req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const result = await db.collection('products').deleteMany({
      $or: [
        { image_url: { $exists: false } },
        { image_url: null },
        { image_url: '' },
      ],
    });
    return res.status(200).json({ deleted_count: result.deletedCount });
  }

  // /api/products/check-duplicates
  if (subPath === 'check-duplicates' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const pipeline = [
      { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$id' } } },
      { $match: { count: { $gt: 1 } } },
    ];
    const duplicates = await db.collection('products').aggregate(pipeline).toArray();
    return res.status(200).json({ duplicates, count: duplicates.length });
  }

  // Root /api/products or /api/public/products
  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const filter: any = {};
      if (query.category) {
        filter.category = new RegExp(`^${query.category}$`, 'i');
      }
      if (query.featured !== undefined) {
        filter.is_featured = query.featured === 'true';
      }
      if (query.q) {
        filter.$or = [
          { name: { $regex: query.q, $options: 'i' } },
          { name_en: { $regex: query.q, $options: 'i' } },
          { variety: { $regex: query.q, $options: 'i' } },
          { category: { $regex: query.q, $options: 'i' } },
          { info: { $regex: query.q, $options: 'i' } },
        ];
      }

      const limit = parseInt(query.limit) || 100;
      const skip = parseInt(query.skip) || 0;

      const raw = await db
        .collection('products')
        .find(filter)
        .sort({ sort_order: 1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const items = raw.map(cleanDoc);
      return res.status(200).json({ items, count: items.length });
    }

    if (req.method === 'POST') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      const newProduct = {
        id: crypto.randomUUID(),
        name: body.name || '',
        name_en: body.name_en || '',
        category: body.category || 'Uncategorized',
        rate: body.rate || '',
        cut: body.cut || '',
        panna: body.panna || '',
        variety: body.variety || '',
        info: body.info || '',
        image_url: body.image_url || '',
        images: body.images || [],
        stock_status: body.stock_status || 'In Stock',
        is_featured: Boolean(body.is_featured),
        sort_order: Number(body.sort_order) || 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.collection('products').insertOne(newProduct);
      return res.status(201).json(cleanDoc(newProduct));
    }
  }

  // /api/products/:id
  const prodId = subPath;
  if (prodId) {
    if (req.method === 'GET') {
      const product = await db.collection('products').findOne({
        $or: [{ id: prodId }, { _id: prodId }],
      });
      if (!product) return res.status(404).json({ detail: 'Product not found' });
      return res.status(200).json(cleanDoc(product));
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      body.updated_at = new Date();
      delete body._id;
      delete body.id;

      const result = await db.collection('products').findOneAndUpdate(
        { $or: [{ id: prodId }, { _id: prodId }] },
        { $set: body },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ detail: 'Product not found' });
      return res.status(200).json(cleanDoc(result));
    }

    if (req.method === 'DELETE') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const result = await db.collection('products').deleteOne({
        $or: [{ id: prodId }, { _id: prodId }],
      });

      if (result.deletedCount === 0) return res.status(404).json({ detail: 'Product not found' });
      return res.status(200).json({ message: 'Product deleted successfully' });
    }
  }

  return res.status(404).json({ error: 'Products route not found' });
}
