import type { Detection } from 'libreyolo-web';
import type { createOutfitScore } from '../outfit-score';
import { OUTFIT_TIER_EMOJI, type OutfitTierId } from '../outfit-score-copy';
import type { FrameSize, Minigame, MinigamePanel } from './types';

const ITEM_DISPLAY: Record<string, string> = {
  tie: 'tie',
  handbag: 'bag',
  backpack: 'backpack',
  umbrella: 'umbrella',
  suitcase: 'suitcase',
  'cell phone': 'phone (down!)',
};

export function createOutfitMinigame(
  outfitScore: ReturnType<typeof createOutfitScore>,
): Minigame {
  function reset() {
    outfitScore.reset();
  }

  function onFrame(
    detections: readonly Detection[],
    now: number,
    frame?: FrameSize,
  ): MinigamePanel {
    const s = outfitScore.update(detections, now, frame);
    const fitLine =
      s.flags.length > 0
        ? `Fit items: ${s.flags.map((f) => ITEM_DISPLAY[f] ?? f).join(' · ')}`
        : 'No accessories detected — bare-minimum fit';
    const emoji = OUTFIT_TIER_EMOJI[s.tierId as OutfitTierId];
    const secondary = emoji ? `${emoji} ${s.tierLabel}` : s.tierLabel;

    return {
      kicker: 'Outfit check',
      primary: String(s.score),
      secondary,
      roast: s.roast,
      tierId: s.tierId,
      meterPercent: s.score,
      subtitle: fitLine,
      receipt: s.receipt,
      receiptFooter:
        s.receipt.length > 0
          ? `Frame raw: ${s.rawScore} · Display (smoothed): ${s.score}`
          : undefined,
    };
  }

  return { id: 'outfit', reset, onFrame };
}
