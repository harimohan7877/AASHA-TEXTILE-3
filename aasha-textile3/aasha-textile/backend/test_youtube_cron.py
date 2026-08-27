"""
Local test runner for YouTube Auto-Detection (Phase 2)
Tests fetching latest video from uploads playlist and inserting a Drop into MongoDB.
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def run_youtube_detection_test():
    print("=" * 65)
    print("  Testing YouTube Auto-Detection (Phase 2 Local Test)")
    print("=" * 65)

    api_key = os.environ.get("YOUTUBE_API_KEY")
    playlist_id = os.environ.get("YOUTUBE_UPLOADS_PLAYLIST_ID")
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "aasha_textile")

    if not api_key:
        api_key = input("Enter YouTube API Key: ").strip()
    if not playlist_id:
        playlist_id = input("Enter YouTube Uploads Playlist ID (starts with UU...): ").strip()
    if not mongo_url:
        mongo_url = input("Enter MongoDB URL: ").strip()

    if not api_key or not playlist_id or not mongo_url:
        print("[ERROR] Missing required inputs.")
        sys.exit(1)

    print("\n1. Fetching latest video from YouTube uploads playlist (Cost: 1 quota unit)...")
    yt_url = "https://www.googleapis.com/youtube/v3/playlistItems"
    params = {
        "part": "snippet,contentDetails",
        "playlistId": playlist_id,
        "maxResults": 1,
        "key": api_key,
    }

    resp = requests.get(yt_url, params=params)
    if resp.status_code != 200:
        print(f"[ERROR] YouTube API failed ({resp.status_code}): {resp.text}")
        sys.exit(1)

    data = resp.json()
    items = data.get("items", [])
    if not items:
        print("[INFO] No videos found in the specified playlist.")
        return

    latest = items[0]
    snippet = latest.get("snippet", {})
    video_id = snippet.get("resourceId", {}).get("videoId") or latest.get("contentDetails", {}).get("videoId")
    title = snippet.get("title", "")
    published_at_str = snippet.get("publishedAt", "")
    
    print(f" [OK] Latest video detected: '{title}' (ID: {video_id})")

    # Connect to MongoDB
    print("\n2. Connecting to MongoDB...")
    client = MongoClient(mongo_url)
    db = client[db_name]
    drops_col = db["drops"]

    # Check if exists
    existing = drops_col.find_one({"youtubeVideoId": video_id})
    if existing:
        print(f" [INFO] Video {video_id} already exists in 'drops' collection.")
        print(f"  - Drop ID: {existing.get('id')}")
        print(f"  - Status: {existing.get('status')}")
        print(f"  - Expires At: {existing.get('expiresAt')}")
    else:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=5)

        new_drop = {
            "id": str(uuid.uuid4()),
            "youtubeVideoId": video_id,
            "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
            "title": title,
            "thumbnailUrl": snippet.get("thumbnails", {}).get("high", {}).get("url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
            "publishedAt": published_at_str,
            "addedAt": now,
            "expiresAt": expires_at,
            "products": [],
            "status": "active",
        }

        drops_col.insert_one(new_drop)
        print(f" [SUCCESS] Created new Drop document in MongoDB!")
        print(f"  - Drop ID: {new_drop['id']}")
        print(f"  - Video ID: {video_id}")
        print(f"  - Added At (UTC): {now.isoformat()}")
        print(f"  - Expires At (UTC): {expires_at.isoformat()} (5 days TTL)")

    client.close()
    print("\n[DONE] YouTube detection test complete.")


if __name__ == "__main__":
    run_youtube_detection_test()
