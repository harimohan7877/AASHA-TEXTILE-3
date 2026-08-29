#!/usr/bin/env python3
"""
=============================================================================
Aasha Textile — Video Drop Automator
=============================================================================
This tool automates creating a 5-Day Video Drop on aashatextile.com directly
from a YouTube video and Gemini AI timestamp output.

Features:
1. Extracts HD frame screenshots from YouTube at exact timestamps (without full download).
2. Optimizes photos for instant mobile loading.
3. Automatically uploads photos with 5-day auto-expiry tag.
4. Creates or updates the Drop on the live website.
5. Zero sensitive data is hardcoded (safe for private execution).

Usage:
  python create_drop_from_youtube.py
=============================================================================
"""

import os
import sys
import re
import json
import base64
import subprocess
import getpass
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import requests
except ImportError:
    print("❌ 'requests' library not found. Install with: pip install requests")
    sys.exit(1)

try:
    from PIL import Image
    import io
except ImportError:
    print("❌ 'Pillow' library not found. Install with: pip install Pillow")
    sys.exit(1)


# =============================================================================
# CONFIGURATION & CREDENTIALS LOADER (100% PRIVATE)
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent.parent
SAFE_ENV_FILE = ROOT_DIR / "safe" / "aasha-textile-api.env"

API_BASE_URL = os.getenv("API_BASE_URL", "https://aashatextile.com/api").rstrip("/")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

# Load from safe/ folder if present
if SAFE_ENV_FILE.exists():
    try:
        with open(SAFE_ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip()
                if k == "ADMIN_EMAIL" and not ADMIN_EMAIL:
                    ADMIN_EMAIL = v
                elif k == "ADMIN_PASSWORD" and not ADMIN_PASSWORD:
                    ADMIN_PASSWORD = v
    except Exception:
        pass


def extract_youtube_id(url_or_id: str) -> Optional[str]:
    """Extract 11-char YouTube Video ID from various URL formats."""
    text = url_or_id.strip()
    if len(text) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", text):
        return text
    patterns = [
        r"(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/watch\?v=|\&v=|\/shorts\/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def timestamp_to_seconds(ts: str) -> int:
    """Convert '01:25' or '01:25:30' or raw seconds to integer seconds."""
    ts = str(ts).strip()
    if ts.isdigit():
        return int(ts)
    parts = ts.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 0


def seconds_to_timestamp(sec: int) -> str:
    """Convert integer seconds to HH:MM:SS format for ffmpeg."""
    hours = sec // 3600
    minutes = (sec % 3600) // 60
    seconds = sec % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


# =============================================================================
# AUTHENTICATION
# =============================================================================
def login(email: str, password: str) -> str:
    """Login to Aasha Textile API and return JWT bearer token."""
    url = f"{API_BASE_URL}/auth/login"
    resp = requests.post(url, json={"email": email, "password": password}, timeout=15)
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed ({resp.status_code}): {resp.text}")
    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise RuntimeError("No access_token returned by API")
    return token


# =============================================================================
# FRAME CAPTURE (YT-DLP + FFMPEG STREAMING EXTRACTION)
# =============================================================================
def capture_frame_from_youtube(video_id: str, timestamp_sec: int, output_path: Path) -> bool:
    """
    Extract a single crisp HD frame from YouTube at a specific timestamp
    WITHOUT downloading the entire video.
    """
    time_str = seconds_to_timestamp(timestamp_sec)
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    # Method A: Try yt-dlp streaming URL + ffmpeg
    try:
        # Get stream URL from yt-dlp
        cmd_ytdlp = [
            "yt-dlp",
            "-g",
            "-f", "bestvideo[ext=mp4]/best[ext=mp4]/best",
            video_url
        ]
        proc = subprocess.run(cmd_ytdlp, capture_output=True, text=True, timeout=30)
        if proc.returncode == 0 and proc.stdout.strip():
            stream_url = proc.stdout.strip().split("\n")[0]

            # Use ffmpeg to grab exact frame from stream
            cmd_ffmpeg = [
                "ffmpeg",
                "-y",
                "-ss", time_str,
                "-i", stream_url,
                "-frames:v", "1",
                "-q:v", "2",
                str(output_path)
            ]
            ff_proc = subprocess.run(cmd_ffmpeg, capture_output=True, timeout=30)
            if ff_proc.returncode == 0 and output_path.exists() and output_path.stat().st_size > 1000:
                return True
    except Exception:
        pass

    # Method B: Fallback - use yt-dlp section downloader
    try:
        start_sec = max(0, timestamp_sec - 1)
        end_sec = timestamp_sec + 2
        cmd_clip = [
            "yt-dlp",
            "--download-sections", f"*{start_sec}-{end_sec}",
            "--force-keyframes-at-cuts",
            "-o", str(output_path.with_suffix(".mp4")),
            video_url
        ]
        subprocess.run(cmd_clip, capture_output=True, timeout=45)
        temp_mp4 = output_path.with_suffix(".mp4")
        if temp_mp4.exists():
            cmd_extract = [
                "ffmpeg",
                "-y",
                "-ss", "00:00:01",
                "-i", str(temp_mp4),
                "-frames:v", "1",
                "-q:v", "2",
                str(output_path)
            ]
            subprocess.run(cmd_extract, capture_output=True, timeout=15)
            try:
                temp_mp4.unlink()
            except Exception:
                pass
            if output_path.exists() and output_path.stat().st_size > 1000:
                return True
    except Exception:
        pass

    return False


def optimize_and_encode_image(image_path: Path, max_width: int = 1280) -> str:
    """Resize image if needed and return clean Base64 JPEG string."""
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        if img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(float(img.height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85, optimize=True)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")


# =============================================================================
# API UPLOAD FUNCTIONS
# =============================================================================
def upload_drop_image(token: str, base64_data: str, filename: str) -> str:
    """Upload product image with 5-day auto expiry to MongoDB."""
    url = f"{API_BASE_URL}/images/upload?is_drop_image=true&expires_in_days=5"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "data": f"data:image/jpeg;base64,{base64_data}",
        "filename": filename,
        "is_drop_image": True,
        "expires_in_days": 5
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Image upload failed ({resp.status_code}): {resp.text}")
    return resp.json().get("url", "")


def create_or_update_drop(token: str, video_id: str, title: str, products: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create a new Drop or update existing Drop with attached products."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Check if drop exists
    check_url = f"{API_BASE_URL}/drops/{video_id}"
    resp = requests.get(check_url, headers=headers, timeout=15)

    if resp.status_code == 200:
        # Update existing drop
        drop_data = resp.json()
        drop_id = drop_data.get("id") or video_id
        update_url = f"{API_BASE_URL}/drops/{drop_id}"
        patch_payload = {
            "products": products,
            "status": "active"
        }
        if title:
            patch_payload["title"] = title
        up_resp = requests.patch(update_url, json=patch_payload, headers=headers, timeout=20)
        if up_resp.status_code != 200:
            raise RuntimeError(f"Failed to update drop: {up_resp.text}")
        return up_resp.json()
    else:
        # Create new drop
        create_url = f"{API_BASE_URL}/drops"
        create_payload = {
            "youtubeVideoId": video_id,
            "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
            "title": title or "Aasha Textile Video Drop",
            "thumbnailUrl": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        }
        c_resp = requests.post(create_url, json=create_payload, headers=headers, timeout=20)
        if c_resp.status_code not in (200, 201):
            raise RuntimeError(f"Failed to create drop: {c_resp.text}")

        new_drop = c_resp.json()
        drop_id = new_drop.get("id") or video_id

        # Attach products
        update_url = f"{API_BASE_URL}/drops/{drop_id}"
        up_resp = requests.patch(update_url, json={"products": products}, headers=headers, timeout=20)
        if up_resp.status_code != 200:
            raise RuntimeError(f"Failed to attach products to drop: {up_resp.text}")
        return up_resp.json()


# =============================================================================
# MAIN INTERACTIVE FLOW
# =============================================================================
def main():
    print("=" * 70)
    print("🌟 AASHA TEXTILE — AUTOMATIC VIDEO DROP CREATOR 🌟")
    print("=" * 70)
    print("This script will grab HD photos from your YouTube video and publish")
    print("them with 5-day auto expiry directly on aashatextile.com/drops.\n")

    # 1. Credentials
    email = ADMIN_EMAIL
    password = ADMIN_PASSWORD

    if not email:
        email = input("👤 Enter Admin Email: ").strip()
    if not password:
        password = getpass.getpass("🔑 Enter Admin Password: ").strip()

    print("\n⏳ Logging in to Aasha Textile Admin...")
    try:
        token = login(email, password)
        print("✅ Login successful!")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return

    # 2. YouTube Video URL
    yt_input = input("\n🎥 Enter YouTube Video Link or ID: ").strip()
    video_id = extract_youtube_id(yt_input)
    if not video_id:
        print("❌ Invalid YouTube Link or Video ID!")
        return

    print(f"✅ Video ID: {video_id}")

    # 3. Video Title
    default_title = "Aasha Textile Latest Fabric Collection"
    drop_title = input(f"🏷️ Enter Drop Title (Press Enter for default '{default_title}'): ").strip()
    if not drop_title:
        drop_title = default_title

    # 4. Gemini JSON Input
    print("\n📋 Paste the Gemini AI JSON output below.")
    print("   (Example: [{\"time\": \"01:24\", \"name\": \"Rayon Print\", \"rate\": \"₹65/m\", \"details\": \"44 Panna\"}])")
    print("   👉 Paste and press Enter, then type 'DONE' on a new line and press Enter:")

    lines = []
    while True:
        try:
            line = input()
            if line.strip().upper() == "DONE":
                break
            lines.append(line)
        except EOFError:
            break

    raw_json = "\n".join(lines).strip()

    # Automatically extract JSON array [...] even if extra text or headings are present
    match = re.search(r"\[\s*\{.*\}\s*\]", raw_json, flags=re.DOTALL)
    if match:
        raw_json = match.group(0)
    else:
        # Clean markdown if user copied ```json ... ```
        raw_json = re.sub(r"^```(?:json)?", "", raw_json, flags=re.IGNORECASE)
        raw_json = re.sub(r"```$", "", raw_json).strip()

    try:
        gemini_items = json.loads(raw_json)
        if not isinstance(gemini_items, list):
            raise ValueError("Input JSON must be a list of products.")
    except Exception as e:
        print(f"❌ Invalid JSON format: {e}")
        print("💡 Tip: Make sure the JSON starts with '[' and ends with ']'")
        return

    print(f"\n📦 Found {len(gemini_items)} products from Gemini!")

    # 5. Extract Frames and Upload
    temp_dir = BASE_DIR / "temp"
    temp_dir.mkdir(exist_ok=True)

    uploaded_products = []

    print("\n🚀 Processing video frames & uploading...")
    for idx, item in enumerate(gemini_items, start=1):
        name = item.get("name") or item.get("title") or f"Product #{idx}"
        rate = item.get("rate") or item.get("price") or ""
        details = item.get("details") or item.get("info") or ""
        raw_time = item.get("time") or item.get("timestamp") or "00:00"
        timestamp_sec = timestamp_to_seconds(raw_time)

        print(f"\n[{idx}/{len(gemini_items)}] 📸 Extracting frame for '{name}' at {raw_time} ({timestamp_sec}s)...")
        frame_file = temp_dir / f"frame_{video_id}_{idx}_{timestamp_sec}.jpg"

        success = capture_frame_from_youtube(video_id, timestamp_sec, frame_file)
        image_url = ""

        if success and frame_file.exists():
            print(f"   ✨ Frame captured! Uploading to server...")
            try:
                b64 = optimize_and_encode_image(frame_file)
                image_url = upload_drop_image(token, b64, frame_file.name)
                print(f"   ✅ Uploaded: {image_url}")
            except Exception as e:
                print(f"   ⚠️ Upload error: {e}")
            finally:
                try:
                    frame_file.unlink()
                except Exception:
                    pass
        else:
            print(f"   ⚠️ Could not extract frame at {raw_time}. Fallback to YouTube thumbnail.")
            image_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

        uploaded_products.append({
            "id": f"p_{idx}_{video_id}_{timestamp_sec}",
            "title": name,
            "price": rate,
            "details": details,
            "imageUrl": image_url,
            "inStock": True
        })

    # 6. Publish Drop
    print("\n💾 Publishing Drop to live website...")
    try:
        result = create_or_update_drop(token, video_id, drop_title, uploaded_products)
        print("\n" + "=" * 70)
        print("🎉 DROP PUBLISHED SUCCESSFULLY! 🎉")
        print("=" * 70)
        print(f"📺 Video: https://www.youtube.com/watch?v={video_id}")
        print(f"🏷️ Title: {result.get('title')}")
        print(f"🛍️ Total Products Added: {len(uploaded_products)}")
        print(f"⏱️ Expiry: 5 Days (Auto-cleanup active)")
        print(f"🌐 Live Storefront: https://aashatextile.com/drops")
        print("=" * 70)
    except Exception as e:
        print(f"❌ Failed to publish drop: {e}")

    # Clean temp dir
    try:
        for f in temp_dir.glob("*"):
            f.unlink()
        temp_dir.rmdir()
    except Exception:
        pass


if __name__ == "__main__":
    main()
