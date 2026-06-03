import type { IncomingMessage, ServerResponse } from 'node:http';
import { analyzeFrame } from '../server/analyze-frame';

type Req = IncomingMessage & { body?: unknown };

async function readBody(req: Req): Promise<{ image?: string }> {
  // Vercel usually pre-parses JSON into req.body; fall back to the raw stream.
  if (req.body && typeof req.body === 'object') return req.body as { image?: string };
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: Req, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }
  try {
    const { image } = await readBody(req);
    if (!image) throw new Error('Missing "image" in request body');
    const verdict = await analyzeFrame(image);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(verdict));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
}
