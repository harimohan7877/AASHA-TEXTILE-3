import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody, slugify } from '../utils';
import { requireAuth } from '../auth';
import crypto from 'crypto';

export async function handleCategories(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (!subPath || subPath === '') {
    if (req.method === 'GET') {
      const explicit = await db.collection('categories').find({}).sort({ sort_order: 1 }).toArray();

      const productCategories = await db
        .collection('products')
        .aggregate([
          { $group: { _id: '$category', count: { $sum: 1 }, sample_image: { $first: '$image_url' } } },
        ])
        .toArray();

      const explicitMap = new Map();
      explicit.forEach((c) => explicitMap.set(c.name.toLowerCase(), c));

      const merged: any[] = [];
      const seen = new Set();

      explicit.forEach((c) => {
        const key = c.name.toLowerCase();
        const pCat = productCategories.find((p) => (p._id || '').toLowerCase() === key);
        merged.push({
          ...cleanDoc(c),
          product_count: pCat ? pCat.count : 0,
          virtual: false,
        });
        seen.add(key);
      });

      productCategories.forEach((pCat) => {
        const name = pCat._id;
        if (!name) return;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          merged.push({
            id: null,
            name,
            slug: slugify(name),
            description: '',
            image_url: pCat.sample_image || '',
            sort_order: 999,
            product_count: pCat.count,
            virtual: true,
          });
          seen.add(key);
        }
      });

      return res.status(200).json({ items: merged, count: merged.length });
    }

    if (req.method === 'POST') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      const name = (body.name || '').trim();
      if (!name) return res.status(400).json({ detail: 'Category name is required' });

      const newCategory = {
        id: crypto.randomUUID(),
        name,
        slug: body.slug ? slugify(body.slug) : slugify(name),
        description: body.description || '',
        image_url: body.image_url || '',
        sort_order: Number(body.sort_order) || 0,
        created_at: new Date(),
      };

      await db.collection('categories').insertOne(newCategory);
      return res.status(201).json(cleanDoc(newCategory));
    }
  }

  const catId = subPath;
  if (catId) {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const body = parseBody(req);
      delete body._id;
      delete body.id;
      if (body.slug) body.slug = slugify(body.slug);

      const result = await db.collection('categories').findOneAndUpdate(
        { $or: [{ id: catId }, { _id: catId }] },
        { $set: body },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ detail: 'Category not found' });
      return res.status(200).json(cleanDoc(result));
    }

    if (req.method === 'DELETE') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ detail: 'Not authenticated' });

      const result = await db.collection('categories').deleteOne({
        $or: [{ id: catId }, { _id: catId }],
      });

      if (result.deletedCount === 0) return res.status(404).json({ detail: 'Category not found' });
      return res.status(200).json({ message: 'Category deleted successfully' });
    }
  }

  return res.status(404).json({ error: 'Categories route not found' });
}
