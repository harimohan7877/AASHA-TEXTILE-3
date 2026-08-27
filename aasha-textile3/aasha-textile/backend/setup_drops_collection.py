"""
Phase 1: Data Model & DB Setup for Drops Collection
Sets up the 'drops' collection in MongoDB with:
1. Unique index on 'youtubeVideoId'
2. MongoDB TTL index on 'expiresAt' (expireAfterSeconds=0) for automatic cleanup after 5 days
3. Index on 'status' and 'addedAt' for fast query performance

Drop Document Schema:
{
    "id": str (UUID),
    "youtubeVideoId": str (unique),
    "youtubeUrl": str,
    "publishedAt": datetime (UTC, from YouTube),
    "addedAt": datetime (UTC, when Drop created),
    "expiresAt": datetime (UTC, addedAt + 5 days),
    "products": [
        {
            "id": str (UUID, optional),
            "imageUrl": str,
            "title": str,
            "price": str or float,
            "details": str,
            "sizeOptions": list[str] (optional),
            "inStock": bool (default: True)
        }
    ],
    "status": "active" | "deleted_manually" | "expired"
}
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def get_mongo_connection():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "aasha_textile")

    if not mongo_url:
        print("\n[INFO] MONGO_URL not found in .env file.")
        mongo_url = input("Enter MongoDB URL (e.g. mongodb://localhost:27017 or mongodb+srv://...): ").strip()
        if not mongo_url:
            print("ERROR: MongoDB connection URL is required.")
            sys.exit(1)
        db_name = input("Enter DB name [aasha_textile]: ").strip() or "aasha_textile"

    return mongo_url, db_name


def setup_drops_collection(mongo_url: str, db_name: str):
    print("=" * 65)
    print("  Aasha Textile — Phase 1: Drops Collection & TTL Index Setup")
    print("=" * 65)
    print(f"Target Database: {db_name}")
    print(f"Connecting to MongoDB...")

    client = MongoClient(mongo_url)
    db = client[db_name]

    # Test connection
    try:
        client.admin.command("ping")
        print("[OK] MongoDB connection successful!\n")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        sys.exit(1)

    drops_col = db["drops"]

    # 1. Unique index on youtubeVideoId
    print("Creating unique index on 'youtubeVideoId'...")
    drops_col.create_index([("youtubeVideoId", ASCENDING)], unique=True, name="idx_unique_youtube_video_id")
    print(" [OK] Created index 'idx_unique_youtube_video_id'")

    # 2. TTL index on expiresAt (expireAfterSeconds=0)
    print("Creating TTL index on 'expiresAt' (expireAfterSeconds=0)...")
    drops_col.create_index([("expiresAt", ASCENDING)], expireAfterSeconds=0, name="idx_ttl_expires_at")
    print(" [OK] Created TTL index 'idx_ttl_expires_at'")

    # 3. Compound index on status and addedAt for fast storefront/admin queries
    print("Creating query index on ('status', 'addedAt')...")
    drops_col.create_index([("status", ASCENDING), ("addedAt", DESCENDING)], name="idx_status_added_at")
    print(" [OK] Created index 'idx_status_added_at'")

    # Verification
    print("\n--- Current Indexes on 'drops' collection ---")
    indexes = drops_col.index_information()
    for name, info in indexes.items():
        keys = info.get("key", [])
        extra = []
        if info.get("unique"):
            extra.append("UNIQUE")
        if "expireAfterSeconds" in info:
            extra.append(f"TTL: expireAfterSeconds={info['expireAfterSeconds']}")
        extra_str = f" ({', '.join(extra)})" if extra else ""
        print(f"  - {name}: keys={keys}{extra_str}")

    print("\n[SUCCESS] Phase 1 setup completed successfully!")
    client.close()


if __name__ == "__main__":
    url, database = get_mongo_connection()
    setup_drops_collection(url, database)
