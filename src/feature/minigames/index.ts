import type { createDateScore } from '../date-score';
import type { createToxicScore } from '../toxic-score';
import type { createOutfitScore } from '../outfit-score';
import { createPropHuntMinigame } from './prop-hunt';
import { createScoreMinigame } from './score-mode';
import { createToxicMinigame } from './toxic-mode';
import { createOutfitMinigame } from './outfit-mode';
import { createCombinedMinigame } from './combined-mode';
import type { Minigame, MinigameId } from './types';

export type { Minigame, MinigameId, MinigamePanel, ScoreBlock } from './types';
export { MINIGAME_LABELS } from './types';

export function createMinigame(
  id: MinigameId,
  scores: {
    dateScore: ReturnType<typeof createDateScore>;
    toxicScore: ReturnType<typeof createToxicScore>;
    outfitScore: ReturnType<typeof createOutfitScore>;
  },
): Minigame {
  switch (id) {
    case 'score':
      return createScoreMinigame(scores.dateScore);
    case 'toxic':
      return createToxicMinigame(scores.toxicScore);
    case 'prop-hunt':
      return createPropHuntMinigame();
    case 'outfit':
      return createOutfitMinigame(scores.outfitScore);
    case 'combined':
      return createCombinedMinigame(scores.outfitScore, scores.toxicScore);
  }
}
