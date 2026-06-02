import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { roastRouter } from './roast-routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use('/api/roast', roastRouter);

if (isProd) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const httpServer = createServer(app);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Roast Match API en http://0.0.0.0:${PORT}`);
});
