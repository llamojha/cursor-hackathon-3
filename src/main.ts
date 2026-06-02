// Live object detection: webcam -> libreyolo-web -> boxes on a canvas overlay.
//
// libreyolo-web runs ONNX models in the browser on WebGPU (fast) or WASM
// (fallback). We use the high-level loadModel/predict/BoxOverlay API so we
// don't have to touch tensors directly.
import { loadModel, listModels, BoxOverlay } from 'libreyolo-web';

const els = {
  model: document.querySelector<HTMLSelectElement>('#model')!,
  start: document.querySelector<HTMLButtonElement>('#start')!,
  status: document.querySelector<HTMLSpanElement>('#status')!,
  video: document.querySelector<HTMLVideoElement>('#video')!,
  overlay: document.querySelector<HTMLCanvasElement>('#overlay')!,
  fps: document.querySelector<HTMLParagraphElement>('#fps')!,
};

// Default to the smallest/fastest model so the demo starts quickly.
const DEFAULT_MODEL = 'LibreYOLOXn';

let model: Awaited<ReturnType<typeof loadModel>> | null = null;
let overlay: BoxOverlay | null = null;
let running = false;

function setStatus(text: string) {
  els.status.textContent = text;
}

// Populate the model dropdown from whatever the library ships.
function populateModels() {
  const names = listModels().map((m) => m.name);
  for (const name of names) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === DEFAULT_MODEL) opt.selected = true;
    els.model.appendChild(opt);
  }
  if (!names.includes(DEFAULT_MODEL) && names.length) {
    els.model.value = names[0];
  }
}

async function startCamera() {
  setStatus('requesting camera…');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: 1280, height: 960 },
    audio: false,
  });
  els.video.srcObject = stream;
  await els.video.play();

  // Match the overlay canvas to the actual video resolution so box
  // coordinates from the model map 1:1 onto the canvas.
  els.overlay.width = els.video.videoWidth;
  els.overlay.height = els.video.videoHeight;
  overlay = new BoxOverlay({ canvas: els.overlay });
}

async function loadSelectedModel() {
  setStatus(`loading ${els.model.value}…`);
  model = await loadModel(els.model.value);
  setStatus(`ready (${els.model.value})`);
}

// Detection loop, throttled via requestAnimationFrame.
let lastT = performance.now();
async function loop() {
  if (!running || !model || !overlay) return;

  try {
    const result = await model.predict(els.video);
    overlay.draw(result.detections);

    const now = performance.now();
    const fps = 1000 / (now - lastT);
    lastT = now;
    els.fps.textContent = `${result.numDetections} objects · ${fps.toFixed(0)} fps`;
  } catch (err) {
    console.error(err);
    setStatus(`error: ${(err as Error).message}`);
  }

  requestAnimationFrame(loop);
}

els.start.addEventListener('click', async () => {
  els.start.disabled = true;
  try {
    if (!model) await loadSelectedModel();
    await startCamera();
    running = true;
    els.start.textContent = 'Running';
    requestAnimationFrame(loop);
  } catch (err) {
    setStatus(`error: ${(err as Error).message}`);
    els.start.disabled = false;
    els.start.textContent = 'Start camera';
  }
});

// Switching models mid-run: reload, keep the camera going.
els.model.addEventListener('change', async () => {
  if (!running) return;
  running = false;
  await loadSelectedModel();
  running = true;
  requestAnimationFrame(loop);
});

populateModels();
setStatus('idle');
