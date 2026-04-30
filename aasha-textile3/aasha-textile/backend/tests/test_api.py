"""Backend regression tests: auth, settings, testimonials, categories, products, videos, public endpoints."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://69526c5b-b446-456a-b397-44f57d29017d.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = 'hs6579178@gmail.com'
ADMIN_PASSWORD = '787799hhh@@@'


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Health ----------------
def test_health(api):
    r = api.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------------- Auth ----------------
def test_login_success(token):
    assert isinstance(token, str) and len(token) > 20


def test_login_invalid(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_me(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ---------------- Public Settings (trust fields) ----------------
def test_public_settings_has_trust_fields(api):
    r = api.get(f"{BASE_URL}/api/public/settings")
    assert r.status_code == 200
    s = r.json()
    # Required keys must exist even if empty
    for key in ["gst_number", "udyam_number", "owner_name", "established_year", "business_hours",
                "happy_customers", "years_of_trust", "instagram_url", "facebook_url", "youtube_url",
                "google_maps_url", "payment_methods", "shipping_info", "return_policy", "privacy_policy"]:
        assert key in s, f"Missing key: {key}"
    # Agent note says these should be seeded
    print(f"GST={s.get('gst_number')!r} Udyam={s.get('udyam_number')!r} Est={s.get('established_year')!r} "
          f"Owner={s.get('owner_name')!r} Hours={s.get('business_hours')!r} "
          f"Happy={s.get('happy_customers')!r} Trust={s.get('years_of_trust')!r}")


# ---------------- Testimonials ----------------
def test_public_testimonials_seeded(api):
    r = api.get(f"{BASE_URL}/api/testimonials")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 3
    for t in data["items"]:
        assert "_id" not in t
        assert "author_name" in t and "message" in t and "rating" in t
        assert t["is_published"] is True


def test_testimonials_admin_list(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/testimonials/admin", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["count"] >= 3


def test_testimonials_admin_unauth(api):
    r = api.get(f"{BASE_URL}/api/testimonials/admin")
    assert r.status_code in (401, 403)


def test_testimonials_full_crud(api, auth_headers):
    # Create
    payload = {"author_name": f"TEST_{uuid.uuid4().hex[:6]}", "message": "TEST msg", "rating": 4,
               "city": "TestCity", "author_role": "Tester", "is_published": False, "sort_order": 1}
    r = api.post(f"{BASE_URL}/api/testimonials", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    tid = r.json()["id"]
    assert r.json()["author_name"] == payload["author_name"]

    # Unpublished should NOT appear in public list
    pub = api.get(f"{BASE_URL}/api/testimonials").json()
    assert all(it["id"] != tid for it in pub["items"])

    # Patch -> publish + edit
    r = api.patch(f"{BASE_URL}/api/testimonials/{tid}", json={"is_published": True, "message": "UPDATED"},
                  headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["is_published"] is True
    assert r.json()["message"] == "UPDATED"

    # Should appear now in public
    pub = api.get(f"{BASE_URL}/api/testimonials").json()
    assert any(it["id"] == tid for it in pub["items"])

    # Delete
    r = api.delete(f"{BASE_URL}/api/testimonials/{tid}", headers=auth_headers)
    assert r.status_code == 200

    # Verify deletion
    r = api.patch(f"{BASE_URL}/api/testimonials/{tid}", json={"message": "X"}, headers=auth_headers)
    assert r.status_code == 404


# ---------------- Categories ----------------
def test_categories_list(api):
    r = api.get(f"{BASE_URL}/api/categories")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and isinstance(data["items"], list)


def test_categories_full_crud(api, auth_headers):
    name = f"TEST_Cat_{uuid.uuid4().hex[:6]}"
    r = api.post(f"{BASE_URL}/api/categories",
                 json={"name": name, "description": "test desc", "sort_order": 5},
                 headers=auth_headers)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    assert r.json()["name"] == name
    assert r.json()["slug"]

    # Duplicate should 400
    dup = api.post(f"{BASE_URL}/api/categories", json={"name": name}, headers=auth_headers)
    assert dup.status_code == 400

    # Patch
    r = api.patch(f"{BASE_URL}/api/categories/{cid}",
                  json={"description": "updated"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["description"] == "updated"

    # Verify in GET list
    got = api.get(f"{BASE_URL}/api/categories").json()
    assert any(c.get("id") == cid and c.get("description") == "updated" for c in got["items"])

    # Delete
    r = api.delete(f"{BASE_URL}/api/categories/{cid}", headers=auth_headers)
    assert r.status_code == 200


# ---------------- Products ----------------
def test_products_list(api):
    r = api.get(f"{BASE_URL}/api/products")
    assert r.status_code == 200
    assert "items" in r.json()


# ---------------- Videos ----------------
def test_videos_list(api):
    r = api.get(f"{BASE_URL}/api/videos")
    assert r.status_code == 200
    assert "items" in r.json()


# ---------------- Settings update round-trip ----------------
def test_settings_update_persists(api, auth_headers):
    # read current
    before = api.get(f"{BASE_URL}/api/public/settings").json()
    original_hours = before.get("business_hours", "")

    new_val = f"Mon - Sat: 10 AM - 8 PM (TEST {uuid.uuid4().hex[:4]})"
    r = api.patch(f"{BASE_URL}/api/settings",
                  json={"business_hours": new_val}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["business_hours"] == new_val

    after = api.get(f"{BASE_URL}/api/public/settings").json()
    assert after["business_hours"] == new_val

    # restore
    api.patch(f"{BASE_URL}/api/settings",
              json={"business_hours": original_hours}, headers=auth_headers)
