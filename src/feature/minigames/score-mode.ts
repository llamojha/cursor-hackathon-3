import type { Detection } from 'libreyolo-web';
import type { createDateScore } from '../date-score';
import type { Minigame, MinigamePanel } from './types';

export function createScoreMinigame(
  dateScore: ReturnType<typeof createDateScore>,
): Minigame {
  function reset() {
    dateScore.reset();
  }

  function onFrame(detections: readonly Detection[], now: number): MinigamePanel {
    const s = dateScore.update(detections, now);
    return {
      kicker: 'Dateable score',
      primary: String(s.score),
      secondary: s.tierLabel,
      roast: s.roast,
      tierId: s.tierId,
      meterPercent: s.score,
    };
  }

  return { id: 'score', reset, onFrame };
}
