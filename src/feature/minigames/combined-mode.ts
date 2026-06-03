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

const FLAG_ES: Record<string, string> = {
  tie: 'corbata',
  handbag: 'bolso',
  backpack: 'mochila',
  umbrella: 'paraguas',
  suitcase: 'maleta',
  'cell phone': 'móvil',
};

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
        label: 'Toxicidad',
        value: `${t.score}%`,
        tier: withEmoji(TIER_EMOJI[t.tierId as ToxicTierId], t.tierLabel),
        tierId: t.tierId,
        meterPercent: t.score,
      },
    ];

    // Fusiona ambos desgloses bajo cabeceras de sección.
    const receipt: ToxicReceiptLine[] = [];
    if (o.receipt.length) {
      receipt.push({ label: 'Outfit', delta: 0, tone: 'neutral', header: true });
      receipt.push(...o.receipt);
    }
    if (t.receipt.length) {
      receipt.push({ label: 'Toxicidad', delta: 0, tone: 'neutral', header: true });
      receipt.push(...t.receipt);
    }

    const fitLine =
      o.flags.length > 0
        ? `Prendas: ${o.flags.map((f) => FLAG_ES[f] ?? f).join(' · ')}`
        : 'Sin accesorios detectados';

    return {
      kicker: 'Outfit + Toxicidad',
      primary: String(o.score),
      secondary: '',
      roast: combinedRoast(o.score, t.score, o.tierId === 'waiting', now),
      tierId: t.tierId,
      meterPercent: t.score,
      subtitle: fitLine,
      blocks,
      receipt: receipt.length > 0 ? receipt : undefined,
      receiptFooter: `Outfit bruto ${o.rawScore} · Toxicidad bruta ${t.rawScore}%`,
    };
  }

  return { id: 'combined', reset, onFrame };
}
