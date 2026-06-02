import type { Detection } from 'libreyolo-web';
import { RED_FLAG_LABELS } from '../toxic-score-copy';
import type { createToxicScore } from '../toxic-score';
import type { Minigame, MinigamePanel } from './types';

const FLAG_DISPLAY: Record<string, string> = {
  phone: RED_FLAG_LABELS['cell phone']!,
  laptop: RED_FLAG_LABELS.laptop!,
  crowd: 'too many humans',
  party: 'messy night',
  tv: RED_FLAG_LABELS.tv!,
};

export function createToxicMinigame(
  toxicScore: ReturnType<typeof createToxicScore>,
): Minigame {
  function reset() {
    toxicScore.reset();
  }

  function onFrame(detections: readonly Detection[], now: number): MinigamePanel {
    const s = toxicScore.update(detections, now);
    const flagLine =
      s.flags.length > 0
        ? `Red flags: ${s.flags.map((f) => FLAG_DISPLAY[f] ?? f).join(' · ')}`
        : 'No red props detected';

    return {
      kicker: 'Toxic prediction',
      primary: `${s.score}%`,
      secondary: s.tierLabel,
      roast: s.roast,
      tierId: s.tierId,
      meterPercent: s.score,
      subtitle: flagLine,
      receipt: s.receipt,
      receiptFooter:
        s.receipt.length > 0
          ? `Frame raw: ${s.rawScore} · Display (smoothed): ${s.score}%`
          : undefined,
    };
  }

  return { id: 'toxic', reset, onFrame };
}
