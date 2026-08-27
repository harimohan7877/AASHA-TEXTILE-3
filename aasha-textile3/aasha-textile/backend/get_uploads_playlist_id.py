"""
Helper utility to find YouTube uploads playlist ID from a channel ID or handle.
"""
import sys
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_uploads_playlist_id(channel_input: str, api_key: str = None) -> str:
    channel_input = channel_input.strip()
    
    # Direct formula calculation: if channel ID starts with UC, uploads playlist is UU...
    if channel_input.startswith("UC") and len(channel_input) == 24:
        uploads_id = "UU" + channel_input[2:]
        return uploads_id

    if not api_key:
        api_key = os.environ.get("YOUTUBE_API_KEY")

    if not api_key:
        print("[WARN] No API key provided for API lookup. If you have the 24-character Channel ID (starts with UC...), the uploads playlist ID is just replacing 'UC' with 'UU'.")
        return None

    # Try query by handle or username or ID via YouTube Data API
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "contentDetails,snippet",
        "key": api_key
    }
    
    if channel_input.startswith("@"):
        params["forHandle"] = channel_input
    elif channel_input.startswith("UC"):
        params["id"] = channel_input
    else:
        params["forUsername"] = channel_input

    res = requests.get(url, params=params)
    if res.status_code != 200:
        print(f"[ERROR] API request failed ({res.status_code}): {res.text}")
        return None

    data = res.json()
    items = data.get("items", [])
    if not items:
        print(f"[ERROR] No channel found for '{channel_input}'")
        return None

    channel = items[0]
    title = channel.get("snippet", {}).get("title", "")
    uploads_id = channel.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads", "")
    print(f"\nChannel Name: {title}")
    return uploads_id


def main():
    print("=" * 60)
    print("  Find YouTube Channel Uploads Playlist ID")
    print("=" * 60)
    
    channel_input = input("Enter YouTube Channel ID (e.g. UC...) or @Handle: ").strip()
    if not channel_input:
        print("Channel input is required.")
        return

    api_key = input("Enter YouTube API Key (press Enter to use .env or direct conversion): ").strip()
    uploads_id = get_uploads_playlist_id(channel_input, api_key or None)
    
    if uploads_id:
        print("\n" + "-" * 50)
        print(f"✅ YOUTUBE_UPLOADS_PLAYLIST_ID = {uploads_id}")
        print("-" * 50)
        print("Add this to your Vercel Environment Variables and .env file.")


if __name__ == "__main__":
    main()
