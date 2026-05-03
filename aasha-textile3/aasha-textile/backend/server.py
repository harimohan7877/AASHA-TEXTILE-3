"""
Aasha Textile - Admin Panel Backend
FastAPI + MongoDB + JWT Auth
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import io
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ------------- CONFIG -------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_HOURS = int(os.environ.get('JWT_EXPIRE_HOURS', '168'))
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Aasha Textile API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ------------- UTILS -------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def clean_doc(doc: Optional[dict]) -> Optional[dict]:
    """Remove Mongo _id if we don't use it, convert datetime to ISO."""
    if not doc:
        return None
    d = dict(doc)
    d.pop('_id', None)
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": now_utc() + timedelta(hours=JWT_EXPIRE_HOURS)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ------------- STARTUP: seed admin + settings + indexes -------------
@app.on_event("startup")
async def on_startup():
    # Admin seed (idempotent)
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": pwd_context.hash(ADMIN_PASSWORD),
            "created_at": now_utc(),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
  else:
    # Keep the password in sync with env on restart (simple for single-admin setup)
    if not pwd_context.verify(ADMIN_PASSWORD, existing["password_hash"]):
        await db.admins.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": pwd_context.hash(ADMIN_PASSWORD)}}
        )
        logger.info("Admin password synced from .env")

    # Settings seed / backfill defaults for missing keys
    DEFAULT_SETTINGS = {
        "key": "site",
        "store_name": "Aasha Textile",
        "tagline": "Quality Fabric, Wholesale Price",
        "whatsapp": "+919999999999",
        "phone": "+919999999999",
        "address": "Your shop address",
        "email": "hs6579178@gmail.com",
        "hero_image_url": "",
        "logo_url": "",
        "about": "Aasha Textile is a trusted wholesale textile shop offering premium quality fabrics.",
        "established_year": "2014",
        "happy_customers": "1000+",
        "years_of_trust": "10+",
        "business_hours": "Mon – Sat: 10:00 AM – 8:00 PM",
        "payment_methods": "UPI, Google Pay, PhonePe, Paytm, Bank Transfer (NEFT/IMPS), Cash",
        "shipping_info": "Pan-India dispatch within 2-3 business days via trusted courier partners. Tracking provided on WhatsApp.",
        "return_policy": "7-day replacement for any manufacturing defect. Product must be unused and in original packaging.",
        "privacy_policy": "We respect your privacy. Your contact details are used only to respond to enquiries and are never shared with third parties.",
        "gst_number": "",
        "udyam_number": "",
        "owner_name": "",
        "instagram_url": "",
        "facebook_url": "",
        "youtube_url": "",
        "google_maps_url": "",
    }
    s = await db.settings.find_one({"key": "site"})
    if not s:
        doc = {**DEFAULT_SETTINGS, "updated_at": now_utc()}
        await db.settings.insert_one(doc)
    else:
        # Backfill missing keys only (never overwrite admin-saved values)
        missing = {k: v for k, v in DEFAULT_SETTINGS.items() if k not in s}
        if missing:
            await db.settings.update_one({"key": "site"}, {"$set": missing})
            logger.info(f"Backfilled settings defaults: {list(missing.keys())}")

    # Testimonials demo-seed (only if collection empty)
    existing_t = await db.testimonials.count_documents({})
    if existing_t == 0:
        demo = [
            {
                "id": str(uuid.uuid4()),
                "author_name": "Rajesh Kumar",
                "author_role": "Retail Shop Owner",
                "city": "Jaipur, Rajasthan",
                "rating": 5,
                "message": "Pichle 3 saal se Aasha Textile se maal le raha hoon. Quality hamesha top-notch milti hai, aur rate bhi market se kam. Home delivery bhi time par. Highly recommended!",
                "avatar_url": None,
                "sort_order": 100,
                "is_published": True,
                "created_at": now_utc(),
                "updated_at": now_utc(),
            },
            {
                "id": str(uuid.uuid4()),
                "author_name": "Priya Sharma",
                "author_role": "Boutique Owner",
                "city": "Indore, MP",
                "rating": 5,
                "message": "Rayon aur Cotton dono fabric yahan se regular mangwati hoon. Colors bilkul waise aate hain jaise photo mein dikhate hain. Bhai sahab WhatsApp par bahut helpful hain — har query ka quick reply dete hain.",
                "avatar_url": None,
                "sort_order": 90,
                "is_published": True,
                "created_at": now_utc(),
                "updated_at": now_utc(),
            },
            {
                "id": str(uuid.uuid4()),
                "author_name": "Mohammed Arif",
                "author_role": "Wholesale Buyer",
                "city": "Surat, Gujarat",
                "rating": 5,
                "message": "Genuine wholesale prices and genuine fabric. GST invoice bhi milti hai jo accounts ke liye zaroori hai. Trusted supplier. Zaroor try karein.",
                "avatar_url": None,
                "sort_order": 80,
                "is_published": True,
                "created_at": now_utc(),
                "updated_at": now_utc(),
            },
        ]
        await db.testimonials.insert_many(demo)
        logger.info(f"Seeded {len(demo)} demo testimonials")

    # Indexes
    await db.products.create_index([("sort_order", -1), ("created_at", -1)])
    await db.products.create_index("category")
    await db.videos.create_index("video_id", unique=True)
    await db.categories.create_index("slug", unique=True)

    logger.info("Startup complete.")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ============================================================
# MODELS
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class ProductIn(BaseModel):
    name: str = Field(..., min_length=1)
    name_en: Optional[str] = None
    variety: Optional[str] = None
    rate: Optional[str] = None
    cut: Optional[str] = None
    panna: Optional[str] = None
    info: Optional[str] = None
    image_url: Optional[str] = None
    category: str = Field(default="Other")
    stock_status: str = Field(default="available")  # available | out_of_stock
    is_featured: bool = False
    sort_order: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    variety: Optional[str] = None
    rate: Optional[str] = None
    cut: Optional[str] = None
    panna: Optional[str] = None
    info: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock_status: Optional[str] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class VideoIn(BaseModel):
    video_id: str
    title: str
    thumbnail_url: Optional[str] = None
    sort_order: int = 0


class VideoUpdate(BaseModel):
    video_id: Optional[str] = None
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    sort_order: Optional[int] = None


class CategoryIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None


class SettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    tagline: Optional[str] = None
    whatsapp: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    hero_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    about: Optional[str] = None
    # Business credentials
    gst_number: Optional[str] = None
    udyam_number: Optional[str] = None
    established_year: Optional[str] = None
    owner_name: Optional[str] = None
    business_hours: Optional[str] = None
    # Stats (display-only numbers, editable by admin)
    happy_customers: Optional[str] = None
    years_of_trust: Optional[str] = None
    # Social
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    youtube_url: Optional[str] = None
    google_maps_url: Optional[str] = None
    # Payment + Policies (rich text / plain text)
    payment_methods: Optional[str] = None
    shipping_info: Optional[str] = None
    return_policy: Optional[str] = None
    privacy_policy: Optional[str] = None


class TestimonialIn(BaseModel):
    author_name: str = Field(..., min_length=1)
    city: Optional[str] = None
    author_role: Optional[str] = None
    rating: int = Field(default=5, ge=1, le=5)
    message: str = Field(..., min_length=1)
    avatar_url: Optional[str] = None
    sort_order: int = 0
    is_published: bool = True


class TestimonialUpdate(BaseModel):
    author_name: Optional[str] = None
    city: Optional[str] = None
    author_role: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    message: Optional[str] = None
    avatar_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_published: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# ============================================================
# AUTH
# ============================================================

@api.post("/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest):
    admin = await db.admins.find_one({"email": payload.email.lower()})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not pwd_context.verify(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": admin["email"]})
    return TokenResponse(access_token=token, email=admin["email"])


@api.get("/auth/me")
async def me(current=Depends(get_current_admin)):
    return {"email": current["email"]}


@api.post("/auth/change-password")
async def change_password(payload: PasswordChange, current=Depends(get_current_admin)):
    admin = await db.admins.find_one({"email": current["email"]})
    if not admin or not pwd_context.verify(payload.current_password, admin["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.admins.update_one(
        {"email": current["email"]},
        {"$set": {"password_hash": pwd_context.hash(payload.new_password)}}
    )
    return {"ok": True, "message": "Password changed successfully"}


# ============================================================
# IMAGES (base64 stored in MongoDB)
# ============================================================

@api.post("/images/upload")
async def upload_image(file: UploadFile = File(...), current=Depends(get_current_admin)):
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        # Resize if too big (max 1600px) & convert RGBA->RGB
        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = bg
        max_side = 1600
        if max(img.size) > max_side:
            img.thumbnail((max_side, max_side), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        processed = buf.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    image_id = str(uuid.uuid4())
    b64 = base64.b64encode(processed).decode('ascii')
    await db.images.insert_one({
        "id": image_id,
        "data": b64,
        "mime_type": "image/jpeg",
        "size": len(processed),
        "created_at": now_utc(),
    })
    # Build absolute-looking URL path that frontend will prefix with BACKEND_URL
    return {"id": image_id, "url": f"/api/images/{image_id}", "size": len(processed)}


@api.get("/images/{image_id}")
async def get_image(image_id: str):
    doc = await db.images.find_one({"id": image_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Image not found")
    data = base64.b64decode(doc["data"])
    return Response(
        content=data,
        media_type=doc.get("mime_type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ============================================================
# PRODUCTS
# ============================================================

@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    stock_status: Optional[str] = None,
    is_featured: Optional[bool] = None,
    sort: Optional[str] = "sort_order",
    limit: int = Query(500, le=1000),
):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"name_en": {"$regex": q, "$options": "i"}},
            {"variety": {"$regex": q, "$options": "i"}},
            {"info": {"$regex": q, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    if stock_status:
        query["stock_status"] = stock_status
    if is_featured is not None:
        query["is_featured"] = is_featured

    sort_spec = [("sort_order", -1), ("created_at", -1)]
    if sort == "newest":
        sort_spec = [("created_at", -1)]
    elif sort == "name":
        sort_spec = [("name", 1)]

    cursor = db.products.find(query).sort(sort_spec).limit(limit)
    items = [clean_doc(d) for d in await cursor.to_list(length=limit)]
    return {"items": items, "count": len(items)}


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return clean_doc(doc)


@api.post("/products")
async def create_product(payload: ProductIn, current=Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_utc()
    doc["updated_at"] = now_utc()
    await db.products.insert_one(doc)
    return clean_doc(doc)


@api.patch("/products/{product_id}")
async def update_product(product_id: str, payload: ProductUpdate, current=Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        return clean_doc(existing)
    updates["updated_at"] = now_utc()
    await db.products.update_one({"id": product_id}, {"$set": updates})
    doc = await db.products.find_one({"id": product_id})
    return clean_doc(doc)


@api.delete("/products/{product_id}")
async def delete_product(product_id: str, current=Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.post("/products/bulk-delete")
async def bulk_delete_products(ids: List[str], current=Depends(get_current_admin)):
    res = await db.products.delete_many({"id": {"$in": ids}})
    return {"ok": True, "deleted": res.deleted_count}


# ============================================================
# VIDEOS
# ============================================================

@api.get("/videos")
async def list_videos():
    cursor = db.videos.find({}).sort([("sort_order", -1), ("created_at", -1)])
    items = [clean_doc(d) for d in await cursor.to_list(length=500)]
    return {"items": items, "count": len(items)}


@api.post("/videos")
async def create_video(payload: VideoIn, current=Depends(get_current_admin)):
    existing = await db.videos.find_one({"video_id": payload.video_id})
    if existing:
        raise HTTPException(status_code=400, detail="Video with this video_id already exists")
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    if not doc.get("thumbnail_url"):
        doc["thumbnail_url"] = f"https://i.ytimg.com/vi/{payload.video_id}/hqdefault.jpg"
    doc["created_at"] = now_utc()
    doc["updated_at"] = now_utc()
    await db.videos.insert_one(doc)
    return clean_doc(doc)


@api.patch("/videos/{vid}")
async def update_video(vid: str, payload: VideoUpdate, current=Depends(get_current_admin)):
    existing = await db.videos.find_one({"id": vid})
    if not existing:
        raise HTTPException(status_code=404, detail="Video not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "video_id" in updates and updates["video_id"] != existing["video_id"]:
        dupe = await db.videos.find_one({"video_id": updates["video_id"]})
        if dupe:
            raise HTTPException(status_code=400, detail="Another video with this video_id already exists")
    if not updates:
        return clean_doc(existing)
    updates["updated_at"] = now_utc()
    await db.videos.update_one({"id": vid}, {"$set": updates})
    doc = await db.videos.find_one({"id": vid})
    return clean_doc(doc)


@api.delete("/videos/{vid}")
async def delete_video(vid: str, current=Depends(get_current_admin)):
    res = await db.videos.delete_one({"id": vid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"ok": True}


# ============================================================
# CATEGORIES
# ============================================================

def _slugify(s: str) -> str:
    import re
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "category"


@api.get("/categories")
async def list_categories():
    cursor = db.categories.find({}).sort([("sort_order", -1), ("name", 1)])
    items = [clean_doc(d) for d in await cursor.to_list(length=500)]

    # Derive counts from products (including categories not in categories table)
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    counts = {r["_id"]: r["count"] async for r in db.products.aggregate(pipeline)}

    known_names = {c["name"] for c in items}
    # Add virtual rows for categories that exist only in products
    for name, cnt in counts.items():
        if name and name not in known_names:
            items.append({
                "id": None,
                "name": name,
                "slug": _slugify(name),
                "description": None,
                "image_url": None,
                "sort_order": 0,
                "virtual": True,
                "product_count": cnt,
            })

    for it in items:
        if "product_count" not in it:
            it["product_count"] = counts.get(it["name"], 0)

    return {"items": items, "count": len(items)}


@api.post("/categories")
async def create_category(payload: CategoryIn, current=Depends(get_current_admin)):
    slug = payload.slug or _slugify(payload.name)
    existing = await db.categories.find_one({"$or": [{"name": payload.name}, {"slug": slug}]})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    doc = payload.model_dump()
    doc["slug"] = slug
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_utc()
    doc["updated_at"] = now_utc()
    await db.categories.insert_one(doc)
    return clean_doc(doc)


@api.patch("/categories/{cid}")
async def update_category(cid: str, payload: CategoryUpdate, current=Depends(get_current_admin)):
    existing = await db.categories.find_one({"id": cid})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in updates and updates["name"] != existing["name"]:
        # Rename products' category too
        await db.products.update_many({"category": existing["name"]}, {"$set": {"category": updates["name"]}})
    if "slug" in updates:
        updates["slug"] = _slugify(updates["slug"])
    if not updates:
        return clean_doc(existing)
    updates["updated_at"] = now_utc()
    await db.categories.update_one({"id": cid}, {"$set": updates})
    doc = await db.categories.find_one({"id": cid})
    return clean_doc(doc)


@api.delete("/categories/{cid}")
async def delete_category(cid: str, current=Depends(get_current_admin)):
    existing = await db.categories.find_one({"id": cid})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    # Reset products' category to "Other"
    await db.products.update_many({"category": existing["name"]}, {"$set": {"category": "Other"}})
    await db.categories.delete_one({"id": cid})
    return {"ok": True}


# ============================================================
# TESTIMONIALS
# ============================================================

@api.get("/testimonials")
async def list_testimonials():
    """Public: published testimonials only."""
    cursor = db.testimonials.find({"is_published": True}).sort([("sort_order", -1), ("created_at", -1)])
    items = [clean_doc(d) for d in await cursor.to_list(length=500)]
    return {"items": items, "count": len(items)}


@api.get("/testimonials/admin")
async def list_testimonials_admin(current=Depends(get_current_admin)):
    """Admin: all testimonials (published + unpublished)."""
    cursor = db.testimonials.find({}).sort([("sort_order", -1), ("created_at", -1)])
    items = [clean_doc(d) for d in await cursor.to_list(length=500)]
    return {"items": items, "count": len(items)}


@api.post("/testimonials")
async def create_testimonial(payload: TestimonialIn, current=Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_utc()
    doc["updated_at"] = now_utc()
    await db.testimonials.insert_one(doc)
    return clean_doc(doc)


@api.patch("/testimonials/{tid}")
async def update_testimonial(tid: str, payload: TestimonialUpdate, current=Depends(get_current_admin)):
    existing = await db.testimonials.find_one({"id": tid})
    if not existing:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        return clean_doc(existing)
    updates["updated_at"] = now_utc()
    await db.testimonials.update_one({"id": tid}, {"$set": updates})
    doc = await db.testimonials.find_one({"id": tid})
    return clean_doc(doc)


@api.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str, current=Depends(get_current_admin)):
    res = await db.testimonials.delete_one({"id": tid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"ok": True}


# ============================================================
# SETTINGS
# ============================================================

@api.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"key": "site"})
    return clean_doc(s) or {}


@api.patch("/settings")
async def update_settings(payload: SettingsUpdate, current=Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    updates["updated_at"] = now_utc()
    await db.settings.update_one({"key": "site"}, {"$set": updates}, upsert=True)
    s = await db.settings.find_one({"key": "site"})
    return clean_doc(s)


# ============================================================
# DASHBOARD STATS
# ============================================================

@api.get("/dashboard/stats")
async def dashboard_stats(current=Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    featured = await db.products.count_documents({"is_featured": True})
    out_of_stock = await db.products.count_documents({"stock_status": "out_of_stock"})
    total_videos = await db.videos.count_documents({})

    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    by_category = [{"name": r["_id"] or "Uncategorized", "count": r["count"]} async for r in db.products.aggregate(pipeline)]

    recent_cursor = db.products.find({}).sort([("created_at", -1)]).limit(5)
    recent = [clean_doc(d) for d in await recent_cursor.to_list(length=5)]

    return {
        "total_products": total_products,
        "featured": featured,
        "out_of_stock": out_of_stock,
        "in_stock": total_products - out_of_stock,
        "total_videos": total_videos,
        "by_category": by_category,
        "recent_products": recent,
    }


# ============================================================
# PUBLIC (no auth) — useful for future public website
# ============================================================

@api.get("/public/products")
async def public_products(category: Optional[str] = None, featured: Optional[bool] = None, limit: int = 500):
    query: Dict[str, Any] = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    cursor = db.products.find(query).sort([("sort_order", -1), ("created_at", -1)]).limit(limit)
    return {"items": [clean_doc(d) for d in await cursor.to_list(length=limit)]}


@api.get("/public/settings")
async def public_settings():
    s = await db.settings.find_one({"key": "site"})
    return clean_doc(s) or {}


@api.get("/")
async def root():
    return {"message": "Aasha Textile Admin API", "status": "ok"}


@api.get("/health")
async def health():
    return {"status": "ok", "time": now_utc().isoformat()}


# ============================================================
# Register + CORS
# ============================================================
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
