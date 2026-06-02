import type { Detection } from 'libreyolo-web';
import {
  DETECTION_CONFIDENCE,
  countByClass,
  getCount,
} from '../detection-utils';
import type { Minigame, MinigamePanel } from './types';

const TARGETS: readonly string[] = ['cup', 'book', 'bottle', 'potted plant', 'tie'];
const ROUND_MS = 18_000;
const HOLD_MS = 600;

export function createPropHuntMinigame(): Minigame {
  let target: string = TARGETS[0]!;
  let roundEnd = 0;
  let holdStart: number | null = null;
  let wins = 0;
  const counts: Record<string, number> = {};

  function pickTarget() {
    target = TARGETS[Math.floor(Math.random() * TARGETS.length)]!;
  }

  function reset() {
    wins = 0;
    holdStart = null;
    pickTarget();
    roundEnd = performance.now() + ROUND_MS;
    for (const key of Object.keys(counts)) delete counts[key];
  }

  function onFrame(detections: readonly Detection[], now: number): MinigamePanel {
    countByClass(detections, DETECTION_CONFIDENCE, counts);

    if (now >= roundEnd) {
      pickTarget();
      roundEnd = now + ROUND_MS;
      holdStart = null;
    }

    const hasTarget = getCount(counts, target) >= 1;
    if (hasTarget) {
      if (holdStart === null) holdStart = now;
      if (now - holdStart >= HOLD_MS) {
        wins += 1;
        pickTarget();
        roundEnd = now + ROUND_MS;
        holdStart = null;
      }
    } else {
      holdStart = null;
    }

    const secLeft = Math.max(0, Math.ceil((roundEnd - now) / 1000));
    const progress = holdStart === null ? 0 : Math.min(100, ((now - holdStart) / HOLD_MS) * 100);

    return {
      kicker: 'Prop hunt',
      primary: String(wins),
      secondary: `Find: ${target} · ${secLeft}s`,
      roast:
        holdStart === null
          ? `Show a ${target} on camera and hold steady. Wins: ${wins}.`
          : 'Hold it… almost there!',
      tierId: wins >= 3 ? 'main-character' : wins >= 1 ? 'dateable' : 'introvert',
      meterPercent: progress,
    };
  }

  return { id: 'prop-hunt', reset, onFrame };
}
