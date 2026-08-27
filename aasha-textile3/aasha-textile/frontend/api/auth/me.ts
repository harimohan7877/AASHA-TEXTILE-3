import { verifyAdminToken } from '../_lib/auth';
import { applyCors } from '../_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = verifyAdminToken(req);
    return res.status(200).json({ email: admin.email });
  } catch (err: any) {
    return res.status(err.status || 401).json({ detail: err.message || 'Unauthorized' });
  }
}
