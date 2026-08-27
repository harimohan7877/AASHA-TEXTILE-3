import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors, cleanDoc } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);
    const { db } = await connectToDatabase();

    const total_products = await db.collection('products').countDocuments({});
    const featured = await db.collection('products').countDocuments({ is_featured: true });
    const out_of_stock = await db.collection('products').countDocuments({ stock_status: 'out_of_stock' });
    const total_videos = await db.collection('videos').countDocuments({});

    const pipeline = [
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 as const } },
    ];
    const categoryAgg = await db.collection('products').aggregate(pipeline).toArray();
    const by_category = categoryAgg.map((r: any) => ({
      name: r._id || 'Uncategorized',
      count: r.count,
    }));

    const recentDocs = await db
      .collection('products')
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    const recent = recentDocs.map(cleanDoc);

    // Visitor analytics
    const total_pageviews = await db.collection('visits').countDocuments({});
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayVisitorsList = await db.collection('visits').distinct('ip_hash', { date: todayStr });
    const today_visitors = todayVisitorsList.length;

    // Last 7 days stats
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }

    const visitsPipeline = [
      { $match: { date: { $in: dates } } },
      {
        $group: {
          _id: '$date',
          pageviews: { $sum: 1 },
          visitors: { $addToSet: '$ip_hash' },
        },
      },
    ];

    const visitsAgg = await db.collection('visits').aggregate(visitsPipeline).toArray();
    const visitsData: Record<string, { pageviews: number; visitors: number }> = {};
    for (const r of visitsAgg) {
      visitsData[r._id] = {
        pageviews: r.pageviews,
        visitors: r.visitors?.length || 0,
      };
    }

    const daily_stats = dates.map((d) => {
      const dayData = visitsData[d] || { pageviews: 0, visitors: 0 };
      let name = d;
      try {
        const dt = new Date(d);
        name = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } catch {}
      return {
        name,
        pageviews: dayData.pageviews,
        visitors: dayData.visitors,
      };
    });

    return res.status(200).json({
      total_products,
      featured,
      out_of_stock,
      in_stock: total_products - out_of_stock,
      total_videos,
      by_category,
      recent_products: recent,
      total_pageviews,
      today_visitors,
      daily_stats,
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Stats retrieval failed' });
  }
}
