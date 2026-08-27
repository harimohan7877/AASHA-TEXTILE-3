import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { Db } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRE_HOURS = parseInt(process.env.JWT_EXPIRE_HOURS || '168', 10);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function createAccessToken(data: Record<string, any>): string {
  return jwt.sign(data, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRE_HOURS}h`,
    algorithm: 'HS256',
  });
}

export function verifyAdminToken(req: any): { email: string } {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authentication required' };
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
    if (!payload || !payload.sub) {
      throw { status: 401, message: 'Invalid token payload' };
    }
    return { email: payload.sub };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw { status: 401, message: 'Token expired' };
    }
    throw { status: 401, message: 'Invalid token' };
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  // Support both bcrypt and passlib standard hashes if present
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    return false;
  }
}

export async function ensureAdminAndSettings(db: Db) {
  const adminsCol = db.collection('admins');
  const existing = await adminsCol.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    await adminsCol.insertOne({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      password_hash: hashPassword(ADMIN_PASSWORD),
      created_at: new Date(),
    });
  } else {
    // Keep password in sync with env if changed
    if (!verifyPassword(ADMIN_PASSWORD, existing.password_hash)) {
      await adminsCol.updateOne(
        { email: ADMIN_EMAIL },
        { $set: { password_hash: hashPassword(ADMIN_PASSWORD) } }
      );
    }
  }

  // Ensure settings seed
  const settingsCol = db.collection('settings');
  const DEFAULT_SETTINGS: Record<string, any> = {
    key: 'site',
    store_name: 'Aasha Textile',
    tagline: 'Quality Fabric, Wholesale Price',
    whatsapp: '+919999999999',
    phone: '+919999999999',
    address: 'Your shop address',
    email: 'hs6579178@gmail.com',
    hero_image_url: '',
    logo_url: '',
    about: 'Aasha Textile is a trusted wholesale textile shop offering premium quality fabrics.',
    established_year: '2014',
    happy_customers: '1000+',
    years_of_trust: '10+',
    business_hours: 'Mon – Sat: 10:00 AM – 8:00 PM',
    payment_methods: 'UPI, Google Pay, PhonePe, Paytm, Bank Transfer (NEFT/IMPS), Cash',
    shipping_info: 'Pan-India dispatch within 2-3 business days via trusted courier partners. Tracking provided on WhatsApp.',
    return_policy: '7-day replacement for any manufacturing defect. Product must be unused and in original packaging.',
    privacy_policy: 'We respect your privacy. Your contact details are used only to respond to enquiries and are never shared with third parties.',
    gst_number: '',
    udyam_number: '',
    owner_name: '',
    instagram_url: '',
    facebook_url: '',
    youtube_url: '',
    google_maps_url: '',
  };

  const s = await settingsCol.findOne({ key: 'site' });
  if (!s) {
    await settingsCol.insertOne({ ...DEFAULT_SETTINGS, updated_at: new Date() });
  } else {
    const missing: Record<string, any> = {};
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      if (s[k] === undefined) {
        missing[k] = v;
      }
    }
    if (Object.keys(missing).length > 0) {
      await settingsCol.updateOne({ key: 'site' }, { $set: missing });
    }
  }
}
