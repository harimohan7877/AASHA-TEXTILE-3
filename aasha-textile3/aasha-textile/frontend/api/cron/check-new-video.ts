import type { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { connectToDatabase } from '../_lib/mongodb';

export default async function handler(req: any, res: any) {
  // Allow GET and POST for cron jobs
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Verify Vercel Cron or Authorization header if CRON_SECRET is set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;

  if (!apiKey || !playlistId) {
    return res.status(500).json({
      error: 'Missing YouTube configuration. Please set YOUTUBE_API_KEY and YOUTUBE_UPLOADS_PLAYLIST_ID.',
    });
  }

  try {
    // 1. Fetch latest video from uploads playlist (1 quota unit cost)
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
      playlistId
    )}&maxResults=1&key=${encodeURIComponent(apiKey)}`;

    const ytResponse = await fetch(ytUrl);
    if (!ytResponse.ok) {
      const errText = await ytResponse.text();
      return res.status(502).json({
        error: `YouTube API returned status ${ytResponse.status}`,
        details: errText,
      });
    }

    const ytData = await ytResponse.json();
    const items = ytData.items || [];

    if (items.length === 0) {
      return res.status(200).json({
        status: 'ok',
        message: 'No videos found in uploads playlist.',
      });
    }

    const latest = items[0];
    const videoId =
      latest.snippet?.resourceId?.videoId || latest.contentDetails?.videoId;

    if (!videoId) {
      return res.status(500).json({
        error: 'Could not extract videoId from YouTube playlist item.',
      });
    }

    const title = latest.snippet?.title || 'New Video Drop';
    const publishedAtStr = latest.snippet?.publishedAt;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

    const thumbnails = latest.snippet?.thumbnails || {};
    const thumbnailUrl =
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // 2. Connect to MongoDB
    const { db } = await connectToDatabase();
    const dropsCollection = db.collection('drops');

    // 3. Check if Drop already exists
    const existing = await dropsCollection.findOne({ youtubeVideoId: videoId });
    if (existing) {
      return res.status(200).json({
        status: 'ok',
        action: 'already_exists',
        message: `Video ${videoId} is already registered in Drops.`,
        videoId,
        dropId: existing.id || existing._id,
      });
    }

    // 4. Create new Drop document (5 days auto-expiry)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days later

    const newDrop = {
      id: randomUUID(),
      youtubeVideoId: videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      thumbnailUrl,
      publishedAt,
      addedAt: now,
      expiresAt,
      products: [],
      status: 'active',
    };

    await dropsCollection.insertOne(newDrop);

    // 5. 🎯 1 TEER 2 SHIKAR: Auto-save permanently into 'videos' collection (See Our Collection)
    const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const permanentTitle = `${title}    ${formattedDate}`;
    await db.collection('videos').updateOne(
      { video_id: videoId },
      {
        $set: {
          video_id: videoId,
          title: permanentTitle,
          thumbnail_url: thumbnailUrl,
          sort_order: 0,
          created_at: now,
        },
      },
      { upsert: true }
    );

    return res.status(201).json({
      status: 'ok',
      action: 'created',
      message: `New Drop created for video: ${title} (${videoId})`,
      drop: newDrop,
    });
  } catch (error: any) {
    console.error('Error in check-new-video cron:', error);
    return res.status(500).json({
      error: 'Internal server error processing YouTube cron',
      message: error?.message || String(error),
    });
  }
}
