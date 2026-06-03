import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

async function readJson(req: IncomingMessage): Promise<{ image?: string }> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

/**
 * Dev-only: serve POST /api/analyze locally so `vite dev` mirrors the Vercel
 * serverless function. The handler is loaded via ssrLoadModule so the AWS SDK
 * stays out of the browser bundle and is only touched when the route is hit.
 */
function rekognitionDevApi(): Plugin {
  return {
    name: 'rekognition-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/analyze', async (req, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const { image } = await readJson(req);
          if (!image) throw new Error('Missing "image" in request body');
          const mod = await server.ssrLoadModule('/server/analyze-frame.ts');
          const verdict = await mod.analyzeFrame(image);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(verdict));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [rekognitionDevApi()],
  // onnxruntime-web ships large prebuilt wasm/jsep assets; don't pre-bundle.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  server: {
    // WebGPU + getUserMedia need a secure context. localhost counts as secure,
    // but set these so LAN testing from a phone over https works if you proxy.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
