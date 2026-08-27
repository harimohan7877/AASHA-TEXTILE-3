import { applyCors } from './_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
}
