import { loadModel } from 'libreyolo-web';
import type { Detection } from 'libreyolo-web';
import { createToxicScore } from '../feature/toxic-score';
import { captureStage } from '../feature/capture-frame';
import { countByClass, DETECTION_CONFIDENCE } from '../feature/detection-utils';
import { requestRekognition, describeVision } from '../feature/rekognition';
import type { Analysis, Engine, OutfitItem } from './types';

// Self-hosted weights (served same-origin from public/models/, fetched at build
// time by scripts/fetch-models.mjs). YOLOX Nano (~3.6MB, 416) — the lightest
// model in the zoo, so it loads fast and stays cheap on every visit.
const MODEL_URL = '/models/yolox_n.onnx';
const MODEL_OPTIONS = { modelFamily: 'yolox', inputSize: 416, device: 'auto' } as const;

export function createEngine(): Engine {
  let model: Awaited<ReturnType<typeof loadModel>> | null = null;
  let video: HTMLVideoElement | null = null;
  let running = false;
  let lastDetections: readonly Detection[] = [];
  const counts: Record<string, number> = {};
  const toxic = createToxicScore();

  const ready = (async () => {
    model = await loadModel(MODEL_URL, MODEL_OPTIONS);
  })();

  function loop() {
    if (!running || !model || !video) return;
    model
      .predict(video)
      .then((result) => {
        if (!running) return;
        lastDetections = result.detections;
        countByClass(result.detections, DETECTION_CONFIDENCE, counts);
        toxic.update(result.detections, performance.now());
      })
      .catch((err) => console.error('detect', err))
      .finally(() => {
        if (running) requestAnimationFrame(loop);
      });
  }

  async function attachCamera(v: HTMLVideoElement) {
    toxic.reset();
    lastDetections = [];
    // Request the camera FIRST so the permission prompt appears immediately,
    // independent of how long the model download/init takes. Awaiting the model
    // before this would mean a slow/failed load swallows the prompt entirely.
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 1280, height: 960 },
      audio: false,
    });
    v.srcObject = stream;
    await v.play();
    video = v;
    // Start the live detection loop once the model is ready, but do NOT block
    // camera setup (and the outfit countdown) on it. The capture verdict comes
    // from the server (Rekognition), so the scan must proceed even if the local
    // YOLO model loads slowly or fails — otherwise the camera shows live video
    // but never captures after the countdown.
    void ready
      .then(() => {
        if (video !== v) return; // camera was stopped / re-attached meanwhile
        running = true;
        requestAnimationFrame(loop);
      })
      .catch((err) => console.error('model load failed; skipping live detection', err));
  }

  function stopCamera() {
    running = false;
    const stream = video?.srcObject;
    if (stream instanceof MediaStream) {
      for (const track of stream.getTracks()) track.stop();
    }
    if (video) video.srcObject = null;
    video = null;
  }

  function liveCounts(): Record<string, number> {
    return { ...counts };
  }

  async function capture(v: HTMLVideoElement): Promise<Analysis> {
    const t = toxic.update(lastDetections, performance.now());
    const photo = captureStage(v, null);

    let visionLines: string[] = [];
    let redFlags: string[] = [];
    let score = 0;
    let type = 'SIN DIAGNOSTICAR';
    const verdict = await requestRekognition(photo);
    if (verdict?.roast) {
      score = verdict.roast.score;
      type = verdict.roast.type;
      redFlags = verdict.roast.redFlags;
      visionLines = verdict.roast.findings;
    }
    // Bedrock roast missing (e.g. timed out) but Rekognition still saw something
    // → build the verdict locally so the user gets a roast, not an error screen.
    if (redFlags.length === 0 && verdict && (verdict.faceFound || verdict.labels?.length)) {
      const local = describeVision(verdict);
      redFlags = local.roasts;
      visionLines = local.findings;
    }
    if (redFlags.length === 0) {
      redFlags = [
        verdict?.error
          ? `Rekognition no respondió (${verdict.error}). Sin pruebas, pero seguimos sospechando.`
          : 'No se pudo generar el veredicto. La IA se quedó sin palabras (raro).',
      ];
    }

    const outfitItems: OutfitItem[] = t.receipt
      .filter((r) => r.label !== 'vibra base')
      .map((r) => ({ label: r.label, delta: r.delta }));

    return {
      photo,
      outfitItems,
      outfitFlagScore: score,
      toxicityScore: score,
      toxicityType: type,
      redFlags,
      visionLines,
    };
  }

  return { ready, attachCamera, stopCamera, liveCounts, capture };
}
