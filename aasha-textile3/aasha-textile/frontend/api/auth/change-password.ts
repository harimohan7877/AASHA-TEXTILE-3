import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken, verifyPassword, hashPassword } from '../_lib/auth';
import { applyCors, parseBody } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const current = verifyAdminToken(req);
    const { current_password, new_password } = await parseBody(req);

    if (!current_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ detail: 'New password must be at least 6 characters' });
    }

    const { db } = await connectToDatabase();
    const admin = await db.collection('admins').findOne({ email: current.email });

    if (!admin || !verifyPassword(current_password, admin.password_hash)) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    await db.collection('admins').updateOne(
      { email: current.email },
      { $set: { password_hash: hashPassword(new_password) } }
    );

    return res.status(200).json({ ok: true, message: 'Password changed successfully' });
  } catch (err: any) {
    return res.status(err.status || 500).json({ detail: err.message || 'Change password failed' });
  }
}
