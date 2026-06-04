// Downloads the LibreYOLO weights we serve ourselves into public/models/ so the
// browser loads them same-origin instead of fetching cross-origin from
// HuggingFace at runtime. Runs server-side in Node during `npm run build`
// (and `npm run dev`), so it is not subject to the browser COEP/CORS rules that
// our cross-origin-isolated app enforces in production.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HF_BASE = 'https://huggingface.co/LibreYOLO/libreyolo-web/resolve/main';

// Keep this list in sync with the model paths referenced in the app
// (src/toxicheck/engine.ts and guille/src/landing.ts).
const MODELS = [{ file: 'yolox_n.onnx', minBytes: 1_000_000 }];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'models');

async function isPresent(path, minBytes) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size >= minBytes;
  } catch {
    return false;
  }
}

await mkdir(outDir, { recursive: true });

for (const { file, minBytes } of MODELS) {
  const dest = join(outDir, file);
  if (await isPresent(dest, minBytes)) {
    console.log(`[models] ${file} already present, skipping download`);
    continue;
  }

  const url = `${HF_BASE}/${file}`;
  console.log(`[models] downloading ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < minBytes) {
    throw new Error(`Downloaded ${file} looks truncated (${buf.byteLength} bytes)`);
  }

  await writeFile(dest, buf);
  console.log(`[models] saved ${file} (${(buf.byteLength / 1e6).toFixed(1)} MB)`);
}
