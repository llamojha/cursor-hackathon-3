import type { Detection } from 'libreyolo-web';
import type { createOutfitScore } from '../outfit-score';
import type { createToxicScore } from '../toxic-score';
import { OUTFIT_TIER_EMOJI, type OutfitTierId } from '../outfit-score-copy';
import { TIER_EMOJI, type ToxicTierId } from '../toxic-score-copy';
import { combinedRoast } from '../combined-copy';
import type { ToxicReceiptLine } from '../toxic-score';
import type { FrameSize, Minigame, MinigamePanel, ScoreBlock } from './types';

function withEmoji(emoji: string | undefined, label: string): string {
  return emoji ? `${emoji} ${label}` : label;
}

export function createCombinedMinigame(
  outfitScore: ReturnType<typeof createOutfitScore>,
  toxicScore: ReturnType<typeof createToxicScore>,
): Minigame {
  function reset() {
    outfitScore.reset();
    toxicScore.reset();
  }

  function onFrame(
    detections: readonly Detection[],
    now: number,
    frame?: FrameSize,
  ): MinigamePanel {
    const o = outfitScore.update(detections, now, frame);
    const t = toxicScore.update(detections, now);

    const blocks: ScoreBlock[] = [
      {
        label: 'Outfit',
        value: String(o.score),
        tier: withEmoji(OUTFIT_TIER_EMOJI[o.tierId as OutfitTierId], o.tierLabel),
        tierId: o.tierId,
        meterPercent: o.score,
      },
      {
        label: 'Toxicity',
        value: `${t.score}%`,
        tier: withEmoji(TIER_EMOJI[t.tierId as ToxicTierId], t.tierLabel),
        tierId: t.tierId,
        meterPercent: t.score,
      },
    ];

    // Merge both breakdowns under section headers.
    const receipt: ToxicReceiptLine[] = [];
    if (o.receipt.length) {
      receipt.push({ label: 'Outfit', delta: 0, tone: 'neutral', header: true });
      receipt.push(...o.receipt);
    }
    if (t.receipt.length) {
      receipt.push({ label: 'Toxicity', delta: 0, tone: 'neutral', header: true });
      receipt.push(...t.receipt);
    }

    const fitLine =
      o.flags.length > 0 ? `Fit: ${o.flags.join(' · ')}` : 'No accessories detected';

    return {
      kicker: 'Outfit + Toxicity',
      primary: String(o.score),
      secondary: '',
      roast: combinedRoast(o.score, t.score, o.tierId === 'waiting', now),
      tierId: t.tierId,
      meterPercent: t.score,
      subtitle: fitLine,
      blocks,
      receipt: receipt.length > 0 ? receipt : undefined,
      receiptFooter: `Outfit raw ${o.rawScore} · Toxicity raw ${t.rawScore}%`,
    };
  }

  return { id: 'combined', reset, onFrame };
}
