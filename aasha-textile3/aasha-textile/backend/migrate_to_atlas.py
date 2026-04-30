"""
Migrate local MongoDB data to MongoDB Atlas (or any other Mongo cluster).

Usage:
    python migrate_to_atlas.py

Will prompt for source (local) and destination (Atlas) connection strings.
Copies: products, categories, videos, settings, testimonials, admins, images
"""
import os
import sys
from pymongo import MongoClient

COLLECTIONS = ["products", "categories", "videos", "settings", "testimonials", "admins", "images"]


def main():
    print("=" * 60)
    print("  Aasha Textile — MongoDB Local -> Atlas Migration")
    print("=" * 60)

    src_url = input("\n[SOURCE] Local MONGO_URL (e.g. mongodb://localhost:27017): ").strip()
    if not src_url:
        src_url = "mongodb://localhost:27017"
        print(f"  Using default: {src_url}")

    src_db = input("[SOURCE] DB name [aasha_textile]: ").strip() or "aasha_textile"

    dst_url = input("\n[DEST] Atlas MONGO_URL (mongodb+srv://...): ").strip()
    if not dst_url:
        print("ERROR: Destination URL required.")
        sys.exit(1)

    dst_db = input("[DEST] DB name [aasha_textile]: ").strip() or "aasha_textile"

    print(f"\nSource:      {src_url[:50]}... / db={src_db}")
    print(f"Destination: {dst_url[:50]}... / db={dst_db}")
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    if confirm not in ("yes", "y"):
        print("Aborted.")
        sys.exit(0)

    src_client = MongoClient(src_url)
    dst_client = MongoClient(dst_url)
    src = src_client[src_db]
    dst = dst_client[dst_db]

    # Verify connections
    try:
        src_client.admin.command("ping")
        print("\n[OK] Source connection successful")
    except Exception as e:
        print(f"\n[ERR] Source connection failed: {e}")
        sys.exit(1)
    try:
        dst_client.admin.command("ping")
        print("[OK] Destination connection successful")
    except Exception as e:
        print(f"[ERR] Destination connection failed: {e}")
        sys.exit(1)

    print("\n--- Migrating collections ---")
    total = 0
    for col in COLLECTIONS:
        docs = list(src[col].find({}))
        if not docs:
            print(f"  {col:15s} -> 0 docs (skipped)")
            continue

        # Wipe destination collection then insert
        dst[col].delete_many({})
        # Drop _id to avoid conflicts (we use our own `id` field everywhere)
        for d in docs:
            d.pop("_id", None)
        dst[col].insert_many(docs)
        print(f"  {col:15s} -> {len(docs)} docs migrated")
        total += len(docs)

    print(f"\n[DONE] Total {total} documents migrated to Atlas.")
    print("\nNext: Update Render backend env var MONGO_URL to your Atlas URL.")

    src_client.close()
    dst_client.close()


if __name__ == "__main__":
    main()
