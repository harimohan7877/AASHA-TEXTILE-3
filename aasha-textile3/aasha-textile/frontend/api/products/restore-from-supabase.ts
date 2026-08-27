import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);

    const SUPABASE_URL = 'https://qpgrcofsgvezadnwzats.supabase.co';
    const ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ3Jjb2ZzZ3ZlemFkbnd6YXRzIiwi' +
      'cm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTUwMzcsImV4cCI6MjA5MjgzMTAzN30.' +
      'TzpfeY7eeC5WErV3E_Ma69fS8Eau4VlOmNBI1f9Pbpk';

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&limit=1000`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    });

    if (!resp.ok) {
      return res.status(502).json({ detail: `Supabase returned ${resp.status}` });
    }

    const supabase_products = await resp.json();
    const { db } = await connectToDatabase();
    let imported_count = 0;

    for (const p of supabase_products) {
      const doc: Record<string, any> = {
        id: p.id,
        name: p.name || '',
        name_en: p.name_en || null,
        variety: p.variety || null,
        rate: p.rate || null,
        cut: p.cut || null,
        panna: p.panna || null,
        info: p.info || null,
        image_url: p.image_url || null,
        category: p.category || 'Other',
        stock_status: p.stock_status || 'available',
        is_featured: Boolean(p.is_featured),
        sort_order: Number(p.sort_order || 0),
      };

      try {
        doc.created_at = p.created_at ? new Date(p.created_at) : new Date();
      } catch {
        doc.created_at = new Date();
      }

      try {
        doc.updated_at = p.updated_at ? new Date(p.updated_at) : new Date();
      } catch {
        doc.updated_at = new Date();
      }

      await db.collection('products').updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
      imported_count++;
    }

    return res.status(200).json({ ok: true, count: imported_count });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Supabase restore failed' });
  }
}
