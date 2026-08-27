import { connectToDatabase } from '../_lib/mongodb';
import { createAccessToken, verifyPassword, ensureAdminAndSettings } from '../_lib/auth';
import { applyCors, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = await parseBody(req);
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }

    const { db } = await connectToDatabase();
    await ensureAdminAndSettings(db);

    const admin = await db.collection('admins').findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const isMatch = verifyPassword(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = createAccessToken({ sub: admin.email });
    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      email: admin.email,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: err.message || 'Login failed' });
  }
}
