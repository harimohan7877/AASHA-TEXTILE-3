import { connectToDatabase } from '../_lib/mongodb';
import { verifyAdminToken } from '../_lib/auth';
import { applyCors } from '../_lib/utils';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    verifyAdminToken(req);

    const buffer = await getRawBody(req);
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ detail: 'No image data received' });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ detail: 'Image too large (max 10MB)' });
    }

    const contentType = req.headers['content-type'] || '';
    let fileBuffer: Buffer = buffer;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1] || boundaryMatch[2];
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const headerEndSequence = Buffer.from('\r\n\r\n');

        const start = buffer.indexOf(boundaryBuffer);
        if (start !== -1) {
          const headerEnd = buffer.indexOf(headerEndSequence, start);
          if (headerEnd !== -1) {
            const headerPart = buffer.slice(start, headerEnd).toString('utf-8');
            const mimeMatch = headerPart.match(/Content-Type:\s*([^\r\n]+)/i);
            if (mimeMatch) {
              mimeType = mimeMatch[1].trim();
            }
            const dataStart = headerEnd + headerEndSequence.length;
            const nextBoundary = buffer.indexOf(boundaryBuffer, dataStart);
            const dataEnd = nextBoundary !== -1 ? nextBoundary - 2 : buffer.length;
            fileBuffer = buffer.slice(dataStart, dataEnd);
          }
        }
      }
    } else if (contentType.startsWith('image/')) {
      mimeType = contentType;
    }

    const image_id = randomUUID();
    const b64 = fileBuffer.toString('base64');

    const { db } = await connectToDatabase();
    await db.collection('images').insertOne({
      id: image_id,
      data: b64,
      mime_type: mimeType,
      size: fileBuffer.length,
      created_at: new Date(),
    });

    return res.status(200).json({
      id: image_id,
      url: `/api/images/${image_id}`,
      size: fileBuffer.length,
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    return res.status(err.status || 500).json({ detail: err.message || 'Image upload failed' });
  }
}
