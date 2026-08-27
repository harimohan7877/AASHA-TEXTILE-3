import { connectToDatabase } from '../mongodb';
import { applyCors, cleanDoc, parseBody } from '../utils';
import { requireAuth } from '../auth';

export async function handleDashboard(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  if (subPath === 'stats' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ detail: 'Not authenticated' });

    const totalProducts = await db.collection('products').countDocuments();
    const activeProducts = await db.collection('products').countDocuments({ stock_status: 'In Stock' });
    const outOfStock = await db.collection('products').countDocuments({ stock_status: 'Out of Stock' });
    const featuredProducts = await db.collection('products').countDocuments({ is_featured: true });
    const totalCategories = await db.collection('categories').countDocuments();
    const totalVideos = await db.collection('videos').countDocuments();
    const totalDrops = await db.collection('drops').countDocuments({ status: 'active' });
    const totalTestimonials = await db.collection('testimonials').countDocuments();
    const totalReviews = await db.collection('reviews').countDocuments();
    const totalVisits = await db.collection('visits').countDocuments();

    const categoryBreakdown = await db
      .collection('products')
      .aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    const recentProducts = await db
      .collection('products')
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    return res.status(200).json({
      total_products: totalProducts,
      active_products: activeProducts,
      out_of_stock: outOfStock,
      featured_products: featuredProducts,
      total_categories: totalCategories,
      total_videos: totalVideos,
      total_drops: totalDrops,
      total_testimonials: totalTestimonials,
      total_reviews: totalReviews,
      total_visits: totalVisits,
      category_breakdown: categoryBreakdown.map((c) => ({ category: c._id || 'Uncategorized', count: c.count })),
      recent_products: recentProducts.map(cleanDoc),
    });
  }

  return res.status(404).json({ error: 'Dashboard route not found' });
}

export async function handleTrackVisit(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method === 'POST') {
    const { db } = await connectToDatabase();
    const body = parseBody(req);
    const visit = {
      path: body.path || '/',
      referrer: body.referrer || '',
      user_agent: req.headers['user-agent'] || '',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      timestamp: new Date(),
    };

    await db.collection('visits').insertOne(visit);
    return res.status(200).json({ status: 'ok' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
