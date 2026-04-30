"""
One-shot migration: Supabase -> local MongoDB
Reads products & videos from public Supabase REST API and imports into MongoDB.
Safe to re-run: uses UPSERT by 'id'.
"""
import os
import sys
import asyncio
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = "https://qpgrcofsgvezadnwzats.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ3Jjb2ZzZ3ZlemFkbnd6YXRzIiwi"
    "cm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTUwMzcsImV4cCI6MjA5MjgzMTAzN30."
    "TzpfeY7eeC5WErV3E_Ma69fS8Eau4VlOmNBI1f9Pbpk"
)

HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}


def fetch_table(table: str):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1000"
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def to_dt(s):
    if not s:
        return datetime.now(timezone.utc)
    try:
        # Normalize Postgres timestamp
        s = s.replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except Exception:
        return datetime.now(timezone.utc)


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Fetching products from Supabase...")
    products = fetch_table("products")
    print(f"  -> {len(products)} products")

    print("Fetching videos from Supabase...")
    videos = fetch_table("videos")
    print(f"  -> {len(videos)} videos")

    imported_p, imported_v = 0, 0

    for p in products:
        doc = {
            "id": p["id"],
            "name": p.get("name") or "",
            "name_en": p.get("name_en"),
            "variety": p.get("variety"),
            "rate": p.get("rate"),
            "cut": p.get("cut"),
            "panna": p.get("panna"),
            "info": p.get("info"),
            "image_url": p.get("image_url"),
            "category": p.get("category") or "Other",
            "stock_status": p.get("stock_status") or "available",
            "is_featured": bool(p.get("is_featured")),
            "sort_order": int(p.get("sort_order") or 0),
            "created_at": to_dt(p.get("created_at")),
            "updated_at": to_dt(p.get("updated_at")),
        }
        await db.products.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        imported_p += 1

    # seed categories table based on unique categories found
    seen = set()
    for p in products:
        c = p.get("category") or "Other"
        if c in seen:
            continue
        seen.add(c)
        await db.categories.update_one(
            {"name": c},
            {
                "$setOnInsert": {
                    "id": __import__("uuid").uuid4().hex,
                    "name": c,
                    "slug": c.lower().replace(" ", "-"),
                    "description": None,
                    "image_url": None,
                    "sort_order": 0,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    for v in videos:
        vid_val = v.get("video_id") or ""
        doc = {
            "id": v["id"],
            "video_id": vid_val,
            "title": v.get("title") or "",
            "thumbnail_url": v.get("thumbnail_url") or (f"https://i.ytimg.com/vi/{vid_val}/hqdefault.jpg" if vid_val else None),
            "sort_order": int(v.get("sort_order") or 0),
            "created_at": to_dt(v.get("created_at")),
            "updated_at": to_dt(v.get("updated_at")),
        }
        await db.videos.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        imported_v += 1

    tot_p = await db.products.count_documents({})
    tot_v = await db.videos.count_documents({})
    tot_c = await db.categories.count_documents({})
    print(f"\n✅ Migration done.")
    print(f"   Products in MongoDB: {tot_p} (imported this run: {imported_p})")
    print(f"   Videos   in MongoDB: {tot_v} (imported this run: {imported_v})")
    print(f"   Categories seeded : {tot_c}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
