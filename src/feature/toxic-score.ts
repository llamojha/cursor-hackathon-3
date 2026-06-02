import type { Detection } from 'libreyolo-web';
import {
  CONTEXTUAL_ROASTS,
  POINT_CAMERA_ROAST,
  TIER_ROASTS,
  TOXIC_TIERS,
  type ToxicTier,
  type ToxicTierId,
} from './toxic-score-copy';
import {
  DETECTION_CONFIDENCE,
  countByClass,
  getCount,
} from './detection-utils';

export const EMA_ALPHA = 0.15;
export const ROAST_ROTATE_MS = 8000;
const BASELINE_TOXIC = 12;

export type ToxicReceiptLine = {
  label: string;
  delta: number;
  /** Color override; when absent, color is derived from the sign of delta. */
  tone?: 'good' | 'bad' | 'neutral';
  /** Render as a section title (no delta number) instead of a line item. */
  header?: boolean;
};

export type ToxicScoreSnapshot = {
  score: number;
  rawScore: number;
  tierId: ToxicTierId | 'waiting';
  tierLabel: string;
  roast: string;
  flags: string[];
  receipt: ToxicReceiptLine[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Per-frame breakdown; single source of truth for raw toxicity math. */
export function computeToxicBreakdown(counts: Record<string, number>): {
  raw: number;
  receipt: ToxicReceiptLine[];
} {
  const receipt: ToxicReceiptLine[] = [];
  let score = BASELINE_TOXIC;
  receipt.push({ label: 'base vibe', delta: BASELINE_TOXIC });

  const phones = getCount(counts, 'cell phone');
  if (phones >= 1) {
    receipt.push({ label: 'phone in frame', delta: 22 });
    score += 22;
  }
  if (phones >= 2) {
    receipt.push({ label: 'second phone', delta: 18 });
    score += 18;
  }

  if (getCount(counts, 'laptop') >= 1) {
    receipt.push({ label: 'laptop', delta: 20 });
    score += 20;
  }
  if (getCount(counts, 'tv') >= 1) {
    receipt.push({ label: 'tv', delta: 10 });
    score += 10;
  }

  const persons = getCount(counts, 'person');
  if (persons >= 2) {
    receipt.push({ label: 'crowd (2+ people)', delta: 28 });
    score += 28;
  } else if (persons === 0) {
    receipt.push({ label: 'nobody in frame', delta: 8 });
    score += 8;
  }

  const party = getCount(counts, 'bottle') + getCount(counts, 'wine glass');
  if (party >= 2) {
    receipt.push({ label: 'party drinks', delta: 12 });
    score += 12;
  } else if (party === 1) {
    receipt.push({ label: 'one drink', delta: 5 });
    score += 5;
  }

  if (getCount(counts, 'couch') >= 1 && phones >= 1) {
    receipt.push({ label: 'couch + phone', delta: 8 });
    score += 8;
  }

  if (persons === 1 && phones === 0 && getCount(counts, 'laptop') === 0) {
    receipt.push({ label: 'solo, no phone/laptop', delta: -10 });
    score -= 10;
  }
  if (getCount(counts, 'book') >= 1 && phones === 0) {
    receipt.push({ label: 'book, phone-free', delta: -6 });
    score -= 6;
  }
  if (getCount(counts, 'potted plant') >= 1) {
    receipt.push({ label: 'plant', delta: -5 });
    score -= 5;
  }

  return { raw: clamp(Math.round(score), 0, 100), receipt };
}

export function computeToxicRaw(counts: Record<string, number>): number {
  return computeToxicBreakdown(counts).raw;
}

export function toxicTierFromScore(score: number): ToxicTier {
  const tier = TOXIC_TIERS.find((t) => score >= t.min && score <= t.max);
  return tier ?? TOXIC_TIERS[0];
}

function pickContextualRoast(counts: Record<string, number>): string | null {
  for (const rule of CONTEXTUAL_ROASTS) {
    if (rule.match(counts)) return rule.line;
  }
  return null;
}

function pickTierRoast(tierId: ToxicTierId, index: number): string {
  return TIER_ROASTS[tierId][index % TIER_ROASTS[tierId].length]!;
}

function collectFlags(counts: Record<string, number>): string[] {
  const flags: string[] = [];
  if (getCount(counts, 'cell phone') >= 1) flags.push('phone');
  if (getCount(counts, 'laptop') >= 1) flags.push('laptop');
  if (getCount(counts, 'person') >= 2) flags.push('crowd');
  if (getCount(counts, 'bottle') + getCount(counts, 'wine glass') >= 2) {
    flags.push('party');
  }
  if (getCount(counts, 'tv') >= 1) flags.push('tv');
  return flags;
}

export function createToxicScore() {
  let smoothed = BASELINE_TOXIC;
  let currentTierId: ToxicTierId | 'waiting' = 'waiting';
  let roastIndex = 0;
  let lastRoastRotate = 0;
  let hasSeenDetection = false;
  const counts: Record<string, number> = {};

  function reset() {
    smoothed = BASELINE_TOXIC;
    currentTierId = 'waiting';
    roastIndex = 0;
    lastRoastRotate = 0;
    hasSeenDetection = false;
    for (const key of Object.keys(counts)) delete counts[key];
  }

  function update(
    detections: readonly Detection[],
    now = performance.now(),
  ): ToxicScoreSnapshot {
    countByClass(detections, DETECTION_CONFIDENCE, counts);
    if (Object.keys(counts).length > 0) hasSeenDetection = true;

    const { raw, receipt } = computeToxicBreakdown(counts);
    smoothed = EMA_ALPHA * raw + (1 - EMA_ALPHA) * smoothed;
    const score = clamp(Math.round(smoothed), 0, 100);
    const flags = collectFlags(counts);

    if (!hasSeenDetection) {
      return {
        score,
        rawScore: raw,
        tierId: 'waiting',
        tierLabel: '—',
        roast: POINT_CAMERA_ROAST,
        flags: [],
        receipt: [],
      };
    }

    const tier = toxicTierFromScore(score);
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
      rawScore: raw,
      tierId: tier.id,
      tierLabel: tier.label,
      roast,
      flags,
      receipt,
    };
  }

  return { update, reset };
}
