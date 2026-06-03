import type { Detection } from 'libreyolo-web';
import {
  FRAMING_ROASTS,
  OUTFIT_CONTEXTUAL_ROASTS,
  OUTFIT_ITEM_LABELS,
  OUTFIT_TIERS,
  OUTFIT_TIER_ROASTS,
  OUTFIT_WAITING_ROAST,
  type OutfitTier,
  type OutfitTierId,
} from './outfit-score-copy';
import {
  DETECTION_CONFIDENCE,
  countByClass,
  getCount,
} from './detection-utils';
import { assessFraming, type Framing } from './framing';
import type { ToxicReceiptLine } from './toxic-score';

export type FrameSize = { width: number; height: number };

export const EMA_ALPHA = 0.15;
export const ROAST_ROTATE_MS = 8000;
const BASELINE_OUTFIT = 30;

/** COCO accessories that count as an intentional fit, with their fit boost. */
const ACCESSORIES: readonly { label: string; delta: number }[] = [
  { label: 'tie', delta: 22 },
  { label: 'handbag', delta: 14 },
  { label: 'backpack', delta: 10 },
  { label: 'umbrella', delta: 8 },
  { label: 'suitcase', delta: 6 },
];

export type OutfitScoreSnapshot = {
  score: number;
  rawScore: number;
  tierId: OutfitTierId | 'waiting';
  tierLabel: string;
  roast: string;
  flags: string[];
  receipt: ToxicReceiptLine[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Per-frame breakdown; single source of truth for raw outfit-energy math. */
export function computeOutfitBreakdown(
  counts: Record<string, number>,
  framing: Framing | null,
): {
  raw: number;
  receipt: ToxicReceiptLine[];
} {
  const receipt: ToxicReceiptLine[] = [];
  let score = BASELINE_OUTFIT;
  receipt.push({ label: 'base del outfit', delta: BASELINE_OUTFIT, tone: 'neutral' });

  const persons = getCount(counts, 'person');
  if (persons === 1) {
    receipt.push({ label: 'tú, en cuadro', delta: 15, tone: 'good' });
    score += 15;
  } else if (persons >= 2) {
    receipt.push({ label: 'control de looks en grupo', delta: 8, tone: 'good' });
    score += 8;
  }

  let accessoryCount = 0;
  for (const a of ACCESSORIES) {
    if (getCount(counts, a.label) >= 1) {
      receipt.push({
        label: OUTFIT_ITEM_LABELS[a.label] ?? a.label,
        delta: a.delta,
        tone: 'good',
      });
      score += a.delta;
      accessoryCount += 1;
    }
  }

  if (accessoryCount >= 3) {
    receipt.push({ label: 'totalmente accesorizad@', delta: 10, tone: 'good' });
    score += 10;
  }

  if (getCount(counts, 'cell phone') >= 1) {
    receipt.push({ label: 'el móvil arruina la foto', delta: -10, tone: 'bad' });
    score -= 10;
  }

  // Encuadre / "pose" a partir de la caja de la persona.
  if (framing) {
    if (framing.distance === 'good') {
      receipt.push({ label: 'bien encuadrad@', delta: 8, tone: 'good' });
      score += 8;
    } else if (framing.distance === 'far') {
      receipt.push({ label: 'muy lejos — acércate', delta: -8, tone: 'bad' });
      score -= 8;
    } else {
      receipt.push({ label: 'primerísimo plano', delta: -4, tone: 'bad' });
      score -= 4;
    }
    if (framing.offset !== 'center') {
      receipt.push({ label: 'descentrad@', delta: -5, tone: 'bad' });
      score -= 5;
    }
  }

  return { raw: clamp(Math.round(score), 0, 100), receipt };
}

export function outfitTierFromScore(score: number): OutfitTier {
  const tier = OUTFIT_TIERS.find((t) => score >= t.min && score <= t.max);
  return tier ?? OUTFIT_TIERS[0];
}

function pickContextualRoast(counts: Record<string, number>): string | null {
  for (const rule of OUTFIT_CONTEXTUAL_ROASTS) {
    if (rule.match(counts)) return rule.line;
  }
  return null;
}

function pickTierRoast(tierId: OutfitTierId, index: number): string {
  return OUTFIT_TIER_ROASTS[tierId][index % OUTFIT_TIER_ROASTS[tierId].length]!;
}

function collectFlags(counts: Record<string, number>): string[] {
  const items: string[] = [];
  for (const a of ACCESSORIES) {
    if (getCount(counts, a.label) >= 1) items.push(a.label);
  }
  if (getCount(counts, 'cell phone') >= 1) items.push('cell phone');
  return items;
}

export function createOutfitScore() {
  let smoothed = BASELINE_OUTFIT;
  let currentTierId: OutfitTierId | 'waiting' = 'waiting';
  let roastIndex = 0;
  let lastRoastRotate = 0;
  let hasSeenPerson = false;
  const counts: Record<string, number> = {};

  function reset() {
    smoothed = BASELINE_OUTFIT;
    currentTierId = 'waiting';
    roastIndex = 0;
    lastRoastRotate = 0;
    hasSeenPerson = false;
    for (const key of Object.keys(counts)) delete counts[key];
  }

  function update(
    detections: readonly Detection[],
    now = performance.now(),
    frame?: FrameSize,
  ): OutfitScoreSnapshot {
    countByClass(detections, DETECTION_CONFIDENCE, counts);
    if (getCount(counts, 'person') >= 1) hasSeenPerson = true;

    const framing = frame
      ? assessFraming(detections, frame.width, frame.height, DETECTION_CONFIDENCE)
      : null;

    const { raw, receipt } = computeOutfitBreakdown(counts, framing);
    smoothed = EMA_ALPHA * raw + (1 - EMA_ALPHA) * smoothed;
    const score = clamp(Math.round(smoothed), 0, 100);

    // A fit needs a body — until we've ever seen one, prompt the user.
    if (!hasSeenPerson) {
      return {
        score,
        rawScore: raw,
        tierId: 'waiting',
        tierLabel: '—',
        roast: OUTFIT_WAITING_ROAST,
        flags: [],
        receipt: [],
      };
    }

    const tier = outfitTierFromScore(score);
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

    // Bad framing is the most actionable feedback, so it wins the roast slot.
    const framingRoast =
      framing?.distance === 'far'
        ? FRAMING_ROASTS.far
        : framing?.distance === 'close'
          ? FRAMING_ROASTS.close
          : framing && framing.offset !== 'center'
            ? FRAMING_ROASTS.offcenter
            : null;

    const roast = framingRoast ?? contextual ?? pickTierRoast(tier.id, roastIndex);

    return {
      score,
      rawScore: raw,
      tierId: tier.id,
      tierLabel: tier.label,
      roast,
      flags: collectFlags(counts),
      receipt,
    };
  }

  return { update, reset };
}
