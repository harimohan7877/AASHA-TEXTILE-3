import { connectToDatabase } from '../mongodb';
import { applyCors, parseBody } from '../utils';
import { verifyPassword, createAccessToken, requireAuth, hashPassword } from '../auth';

export async function handleAuth(req: any, res: any, subPath: string) {
  if (applyCors(req, res)) return;

  const { db } = await connectToDatabase();

  // POST /api/auth/login
  if (subPath === 'login' && req.method === 'POST') {
    const body = parseBody(req);
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';

    const admin = await db.collection('admins').findOne({ email });
    if (!admin) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = createAccessToken({ email: admin.email, id: admin.id || admin._id?.toString() });
    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      email: admin.email,
    });
  }

  // GET /api/auth/me
  if (subPath === 'me' && req.method === 'GET') {
    const authUser = requireAuth(req);
    if (!authUser) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const admin = await db.collection('admins').findOne({ email: authUser.email });
    if (!admin) {
      return res.status(404).json({ detail: 'Admin not found' });
    }

    return res.status(200).json({
      email: admin.email,
      created_at: admin.created_at,
    });
  }

  // POST /api/auth/change-password
  if (subPath === 'change-password' && req.method === 'POST') {
    const authUser = requireAuth(req);
    if (!authUser) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const body = parseBody(req);
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return res.status(400).json({ detail: 'Both current and new passwords are required' });
    }

    const admin = await db.collection('admins').findOne({ email: authUser.email });
    if (!admin) {
      return res.status(404).json({ detail: 'Admin not found' });
    }

    const isValid = await verifyPassword(current_password, admin.password_hash);
    if (!isValid) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    const newHash = await hashPassword(new_password);
    await db.collection('admins').updateOne(
      { email: authUser.email },
      { $set: { password_hash: newHash, updated_at: new Date() } }
    );

    return res.status(200).json({ message: 'Password changed successfully' });
  }

  return res.status(404).json({ error: 'Auth route not found' });
}
