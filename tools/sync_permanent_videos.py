import os
from pymongo import MongoClient

mongo_url = ""
db_name = "aasha-textile"
with open("safe/aasha-textile-api.env", "r", encoding="utf-8") as f:
    for line in f:
        if line.startswith("MONGO_URL="):
            mongo_url = line.split("=", 1)[1].strip()
        elif line.startswith("DB_NAME="):
            db_name = line.split("=", 1)[1].strip()

client = MongoClient(mongo_url)
db = client[db_name]

# 1. Delete all old dummy videos from videos collection
del_res = db.videos.delete_many({})
print(f"Cleared {del_res.deleted_count} old/dummy videos from 'videos' collection.")

# 2. Sync all video drops permanently into 'videos' collection
drops = list(db.drops.find({}))
print(f"Found {len(drops)} drops in database.")

for drop in drops:
    vid = drop.get("youtubeVideoId")
    if not vid:
        continue
    title = drop.get("title", "Aasha Textile Fabric Drop")
    added_at = drop.get("addedAt") or drop.get("publishedAt")
    date_str = "29 Aug 2026"
    if added_at:
        try:
            date_str = added_at.strftime("%d %b %Y")
        except Exception:
            pass
    
    permanent_title = f"{title}    {date_str}"
    thumb = drop.get("thumbnailUrl") or f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"

    db.videos.update_one(
        {"video_id": vid},
        {
            "$set": {
                "video_id": vid,
                "title": permanent_title,
                "thumbnail_url": thumb,
                "sort_order": 0,
                "created_at": added_at
            }
        },
        upsert=True
    )
    print(f"Permanent Video Synced: '{permanent_title}' ({vid})")

total_videos = db.videos.count_documents({})
print(f"Total permanent videos in 'See Our Collection' section: {total_videos}")
