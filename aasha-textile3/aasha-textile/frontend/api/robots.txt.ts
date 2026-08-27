import { applyCors } from './_lib/utils';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const robotsTxt = 'User-agent: *\nAllow: /\n\nSitemap: https://aashatextile.com/api/sitemap.xml';
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(robotsTxt);
}
