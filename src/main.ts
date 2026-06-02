// Live object detection: webcam -> libreyolo-web -> boxes on a canvas overlay.
import { loadModel, listModels, BoxOverlay } from 'libreyolo-web';
import { captureStage } from './feature/capture-frame';
import { createDateScore } from './feature/date-score';
import { createToxicScore } from './feature/toxic-score';
import { createOutfitScore } from './feature/outfit-score';
import { renderReceiptInto } from './feature/ui-receipt';
import {
  createMinigame,
  type Minigame,
  type MinigameId,
  type MinigamePanel,
  type ScoreBlock,
} from './feature/minigames';

const SESSION_MS = 10_000;

const els = {
  mode: document.querySelector<HTMLSelectElement>('#mode')!,
  model: document.querySelector<HTMLSelectElement>('#model')!,
  start: document.querySelector<HTMLButtonElement>('#start')!,
  status: document.querySelector<HTMLSpanElement>('#status')!,
  video: document.querySelector<HTMLVideoElement>('#video')!,
  overlay: document.querySelector<HTMLCanvasElement>('#overlay')!,
  fps: document.querySelector<HTMLParagraphElement>('#fps')!,
  datePanel: document.querySelector<HTMLElement>('#date-panel')!,
  dateKicker: document.querySelector<HTMLElement>('#date-kicker')!,
  dateScore: document.querySelector<HTMLElement>('#date-score')!,
  dateTier: document.querySelector<HTMLElement>('#date-tier')!,
  dateRoast: document.querySelector<HTMLElement>('#date-roast')!,
  dateFlags: document.querySelector<HTMLElement>('#date-flags')!,
  toxicReceiptWrap: document.querySelector<HTMLElement>('#toxic-receipt-wrap')!,
  toxicReceipt: document.querySelector<HTMLUListElement>('#toxic-receipt')!,
  toxicReceiptFooter: document.querySelector<HTMLElement>('#toxic-receipt-footer')!,
  dateMeter: document.querySelector<HTMLElement>('#date-meter')!,
  dateMeterFill: document.querySelector<HTMLElement>('#date-meter-fill')!,
  combinedStats: document.querySelector<HTMLElement>('#combined-stats')!,
  resultCard: document.querySelector<HTMLElement>('#result-card')!,
  resultSheet: document.querySelector<HTMLElement>('#result-sheet')!,
  resultKicker: document.querySelector<HTMLElement>('#result-kicker')!,
  resultPhoto: document.querySelector<HTMLImageElement>('#result-photo')!,
  resultScore: document.querySelector<HTMLElement>('#result-score')!,
  resultTier: document.querySelector<HTMLElement>('#result-tier')!,
  resultCombined: document.querySelector<HTMLElement>('#result-combined')!,
  resultRoast: document.querySelector<HTMLElement>('#result-roast')!,
  resultReceiptWrap: document.querySelector<HTMLElement>('#result-receipt-wrap')!,
  resultReceipt: document.querySelector<HTMLUListElement>('#result-receipt')!,
  resultReceiptFooter: document.querySelector<HTMLElement>('#result-receipt-footer')!,
  resultAgain: document.querySelector<HTMLButtonElement>('#result-again')!,
};

const DEFAULT_MODEL = 'LibreYOLO9s';

let model: Awaited<ReturnType<typeof loadModel>> | null = null;
let overlay: BoxOverlay | null = null;
let running = false;
let finishingSession = false;
let sessionEndsAt: number | null = null;

const dateScore = createDateScore();
const toxicScore = createToxicScore();
const outfitScore = createOutfitScore();
const scoreEngines = { dateScore, toxicScore, outfitScore };
let activeMinigame: Minigame = createMinigame('combined', scoreEngines);

const liveReceipt = {
  wrap: els.toxicReceiptWrap,
  list: els.toxicReceipt,
  footer: els.toxicReceiptFooter,
};

const cardReceipt = {
  wrap: els.resultReceiptWrap,
  list: els.resultReceipt,
  footer: els.resultReceiptFooter,
};

function setStatus(text: string) {
  els.status.textContent = text;
}

function currentMode(): MinigameId {
  return els.mode.value as MinigameId;
}

function isTimedSession(): boolean {
  // These modes run as a 10s scan that ends on a verdict card.
  const mode = currentMode();
  return mode === 'toxic' || mode === 'outfit' || mode === 'combined';
}

/** Build the dual-score columns from a panel's blocks (live panel or card). */
function renderBlocks(container: HTMLElement, blocks: ScoreBlock[] | undefined) {
  if (!blocks?.length) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }
  container.hidden = false;
  container.replaceChildren(
    ...blocks.map((b) => {
      const col = document.createElement('div');
      col.className = 'combined-stat';
      col.dataset.tier = b.tierId;

      const label = document.createElement('p');
      label.className = 'combined-stat__label';
      label.textContent = b.label;

      const value = document.createElement('p');
      value.className = 'combined-stat__value';
      value.textContent = b.value;

      const tier = document.createElement('p');
      tier.className = 'combined-stat__tier';
      tier.textContent = b.tier;

      const meter = document.createElement('div');
      meter.className = 'combined-stat__meter';
      const fill = document.createElement('div');
      fill.className = 'combined-stat__fill';
      fill.style.width = `${b.meterPercent}%`;
      meter.appendChild(fill);

      col.append(label, value, tier, meter);
      return col;
    }),
  );
}

function switchMinigame() {
  activeMinigame = createMinigame(currentMode(), scoreEngines);
  if (running) activeMinigame.reset();
}

function setDatePanelVisible(visible: boolean) {
  els.datePanel.classList.toggle('date-panel--hidden', !visible);
}

function hideResultCard() {
  els.resultCard.hidden = true;
}

function showResultCard(photo: string, panel: MinigamePanel) {
  els.resultPhoto.src = photo;
  els.resultKicker.textContent = panel.kicker;

  const hasBlocks = !!panel.blocks?.length;
  els.resultScore.hidden = hasBlocks;
  els.resultTier.hidden = hasBlocks;
  if (!hasBlocks) {
    els.resultScore.textContent = panel.primary;
    els.resultTier.textContent = panel.secondary;
  }
  els.resultSheet.dataset.tier = panel.tierId;
  renderBlocks(els.resultCombined, panel.blocks);

  els.resultRoast.textContent = panel.roast;
  renderReceiptInto(panel, cardReceipt);
  els.resultCard.hidden = false;
  els.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderPanel(panel: MinigamePanel, now: number) {
  const hasBlocks = !!panel.blocks?.length;
  const left =
    isTimedSession() && sessionEndsAt !== null
      ? Math.max(0, Math.ceil((sessionEndsAt - now) / 1000))
      : null;

  // Countdown rides the kicker in the dual layout (no single tier line there).
  els.dateKicker.textContent =
    hasBlocks && left !== null ? `${panel.kicker} · ${left}s` : panel.kicker;

  // Single-score elements are hidden whenever we show the dual columns.
  els.dateScore.hidden = hasBlocks;
  els.dateTier.hidden = hasBlocks;
  els.dateMeter.hidden = hasBlocks;

  if (!hasBlocks) {
    els.dateScore.textContent = panel.primary;
    els.dateTier.textContent =
      left !== null ? `${panel.secondary} · ${left}s` : panel.secondary;
    els.dateMeterFill.style.width = `${panel.meterPercent}%`;
    els.datePanel.dataset.tier = panel.tierId;
  }

  renderBlocks(els.combinedStats, panel.blocks);

  els.dateRoast.textContent = panel.roast;
  if (panel.subtitle) {
    els.dateFlags.textContent = panel.subtitle;
    els.dateFlags.hidden = false;
  } else {
    els.dateFlags.textContent = '';
    els.dateFlags.hidden = true;
  }
  renderReceiptInto(panel, liveReceipt);
}

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

function stopCamera() {
  const stream = els.video.srcObject;
  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) track.stop();
  }
  els.video.srcObject = null;
}

async function startCamera() {
  setStatus('requesting camera…');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: 1280, height: 960 },
    audio: false,
  });
  els.video.srcObject = stream;
  await els.video.play();

  els.overlay.width = els.video.videoWidth;
  els.overlay.height = els.video.videoHeight;
  overlay = new BoxOverlay({ canvas: els.overlay });
}

function clearOverlay() {
  const ctx = els.overlay.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, els.overlay.width, els.overlay.height);
}

function stopDetection() {
  running = false;
  sessionEndsAt = null;
  finishingSession = false;
  stopCamera();
  overlay = null;
  clearOverlay();

  els.fps.textContent = '';
  activeMinigame.reset();
  setDatePanelVisible(false);

  els.start.disabled = false;
  els.start.textContent = 'Start camera';
  setStatus(model ? `ready (${els.model.value})` : 'idle');
}

function finishSession(finalPanel: MinigamePanel) {
  if (finishingSession || !running) return;
  finishingSession = true;
  running = false;
  sessionEndsAt = null;

  const photo = captureStage(els.video, els.overlay);
  stopCamera();
  overlay = null;
  clearOverlay();

  els.fps.textContent = '';
  activeMinigame.reset();
  setDatePanelVisible(false);

  if (photo) {
    showResultCard(photo, finalPanel);
    setStatus('10s scan complete');
  } else {
    hideResultCard();
    setStatus('capture failed — try again');
  }

  els.start.disabled = false;
  els.start.textContent = 'Start camera';
  finishingSession = false;
}

async function loadSelectedModel() {
  setStatus(`loading ${els.model.value}…`);
  model = await loadModel(els.model.value);
  setStatus(`ready (${els.model.value})`);
}

let lastT = performance.now();
async function loop() {
  if (!running || !model || !overlay) return;

  try {
    const result = await model.predict(els.video);
    overlay.draw(result.detections);

    const now = performance.now();
    const panel = activeMinigame.onFrame(result.detections, now, {
      width: els.overlay.width,
      height: els.overlay.height,
    });
    renderPanel(panel, now);

    if (
      isTimedSession() &&
      sessionEndsAt !== null &&
      now >= sessionEndsAt
    ) {
      finishSession(panel);
      return;
    }

    const fps = 1000 / (now - lastT);
    lastT = now;
    els.fps.textContent = `${result.numDetections} objects · ${fps.toFixed(0)} fps`;
  } catch (err) {
    console.error(err);
    setStatus(`error: ${(err as Error).message}`);
  }

  if (running) requestAnimationFrame(loop);
}

els.start.addEventListener('click', async () => {
  if (running) {
    stopDetection();
    return;
  }

  hideResultCard();
  els.start.disabled = true;
  try {
    if (!model) await loadSelectedModel();
    switchMinigame();
    await startCamera();
    activeMinigame.reset();
    setDatePanelVisible(true);

    if (isTimedSession()) {
      sessionEndsAt = performance.now() + SESSION_MS;
      setStatus('10-second scan…');
    } else {
      sessionEndsAt = null;
    }

    running = true;
    els.start.disabled = false;
    els.start.textContent = 'Running';
    lastT = performance.now();
    requestAnimationFrame(loop);
  } catch (err) {
    setStatus(`error: ${(err as Error).message}`);
    els.start.disabled = false;
    els.start.textContent = 'Start camera';
    sessionEndsAt = null;
  }
});

els.resultAgain.addEventListener('click', () => {
  hideResultCard();
  els.start.click();
});

els.mode.addEventListener('change', () => {
  hideResultCard();
  switchMinigame();
  sessionEndsAt = null;
});

els.model.addEventListener('change', async () => {
  if (!running) return;
  running = false;
  sessionEndsAt = null;
  activeMinigame.reset();
  await loadSelectedModel();
  running = true;
  if (isTimedSession()) {
    sessionEndsAt = performance.now() + SESSION_MS;
  }
  requestAnimationFrame(loop);
});

populateModels();
setStatus('idle');
