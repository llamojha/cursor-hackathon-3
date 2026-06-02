import type { Detection } from 'libreyolo-web';
import {
  CONTEXTUAL_ROASTS,
  DATEABLE_TIERS,
  POINT_CAMERA_ROAST,
  TIER_ROASTS,
  type DateableTier,
  type DateableTierId,
} from './date-score-copy';
import {
  DETECTION_CONFIDENCE,
  countByClass,
  getCount,
} from './detection-utils';

export const CONFIDENCE_THRESHOLD = DETECTION_CONFIDENCE;
export const EMA_ALPHA = 0.15;
export const ROAST_ROTATE_MS = 8000;
export const BASELINE_SCORE = 50;

export type DateScoreSnapshot = {
  score: number;
  tierId: DateableTierId | 'waiting';
  tierLabel: string;
  roast: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Solo / single-person dateable score from object counts. */
export function computeRawScore(counts: Record<string, number>): number {
  let score = BASELINE_SCORE;

  const persons = getCount(counts, 'person');
  if (persons === 1) score += 20;
  else if (persons === 0) score -= 15;
  else score -= 12;

  const charms =
    getCount(counts, 'book') * 8 +
    getCount(counts, 'potted plant') * 6 +
    Math.min(12, getCount(counts, 'cup') * 6) +
    (getCount(counts, 'tie') >= 1 ? 5 : 0) +
    (getCount(counts, 'handbag') >= 1 ? 5 : 0);
  score += Math.min(28, charms);

  const drinks = getCount(counts, 'wine glass') + getCount(counts, 'bottle');
  if (drinks > 0) score += Math.min(10, drinks * 5);

  if (getCount(counts, 'laptop') >= 1) score -= 20;

  const phones = getCount(counts, 'cell phone');
  if (phones >= 1) score -= 15;
  if (phones >= 2) score -= 6;

  if (persons === 0) score = Math.min(score, 35);

  return clamp(Math.round(score), 0, 100);
}

export function tierFromScore(score: number): DateableTier {
  const tier = DATEABLE_TIERS.find((t) => score >= t.min && score <= t.max);
  return tier ?? DATEABLE_TIERS[0];
}

function pickContextualRoast(counts: Record<string, number>): string | null {
  for (const rule of CONTEXTUAL_ROASTS) {
    if (rule.match(counts)) return rule.line;
  }
  return null;
}

function pickTierRoast(tierId: DateableTierId, index: number): string {
  const pool = TIER_ROASTS[tierId];
  return pool[index % pool.length]!;
}

export function createDateScore() {
  let smoothed = BASELINE_SCORE;
  let currentTierId: DateableTierId | 'waiting' = 'waiting';
  let roastIndex = 0;
  let lastRoastRotate = 0;
  let hasSeenDetection = false;
  const counts: Record<string, number> = {};

  function reset() {
    smoothed = BASELINE_SCORE;
    currentTierId = 'waiting';
    roastIndex = 0;
    lastRoastRotate = 0;
    hasSeenDetection = false;
    for (const key of Object.keys(counts)) delete counts[key];
  }

  function update(
    detections: readonly Detection[],
    now = performance.now(),
  ): DateScoreSnapshot {
    countByClass(detections, CONFIDENCE_THRESHOLD, counts);
    if (Object.keys(counts).length > 0) hasSeenDetection = true;

    const raw = computeRawScore(counts);
    smoothed = EMA_ALPHA * raw + (1 - EMA_ALPHA) * smoothed;
    const score = clamp(Math.round(smoothed), 0, 100);

    if (!hasSeenDetection) {
      return {
        score,
        tierId: 'waiting',
        tierLabel: '—',
        roast: POINT_CAMERA_ROAST,
      };
    }

    const tier = tierFromScore(score);
    const contextual = pickContextualRoast(counts);
    const tierChanged = tier.id !== currentTierId;

    if (tierChanged) {
      currentTierId = tier.id;
      roastIndex = 0;
      lastRoastRotate = now;
    } else if (now - lastRoastRotate >= ROAST_ROTATE_MS) {
      roastIndex += 1;
      lastRoastRotate = now;
    }

    const roast = contextual ?? pickTierRoast(tier.id, roastIndex);

    return {
      score,
      tierId: tier.id,
      tierLabel: tier.label,
      roast,
    };
  }

  return { update, reset };
}
