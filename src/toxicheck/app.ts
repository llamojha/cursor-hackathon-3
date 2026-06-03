import { createEngine } from './engine';
import type {
  AppState,
  Match,
  ScreenContext,
  ScreenFactory,
  ScreenId,
  ScreenInstance,
} from './types';
import { createSplashScreen } from './screens/splash';
import { createVerifyScreen } from './screens/verify';
import { createOutfitScreen } from './screens/outfit';
import { createScoreScreen } from './screens/score';
import { createMatchesScreen } from './screens/matches';
import { createQuizScreen } from './screens/quiz';
import { createChatScreen } from './screens/chat';

const FACTORIES: Record<ScreenId, ScreenFactory> = {
  splash: createSplashScreen,
  verify: createVerifyScreen,
  outfit: createOutfitScreen,
  score: createScoreScreen,
  matches: createMatchesScreen,
  quiz: createQuizScreen,
  chat: createChatScreen,
};

function defaultMatches(): Match[] {
  return [
    {
      name: 'Álex',
      age: 27,
      score: 81,
      type: 'GHOSTEADOR SERIAL',
      why: 'Os dejáis en visto al mismo ritmo. Almas gemelas del silencio.',
    },
    {
      name: 'Bruno',
      age: 31,
      score: 68,
      type: 'WORKAHOLIC EMOCIONAL',
      why: 'Ambos respondéis “ahora te escribo” y nunca lo hacéis. Compatibles.',
    },
  ];
}

export function bootToxiCheck(root: HTMLElement) {
  const engine = createEngine();
  const state: AppState = {
    analysis: null,
    matches: defaultMatches(),
    quizCorrect: 0,
  };

  let current: ScreenInstance | null = null;

  const ctx: ScreenContext = {
    navigate,
    state,
    engine,
  };

  function navigate(to: ScreenId) {
    current?.onLeave?.();
    current = FACTORIES[to](ctx);
    root.replaceChildren(current.el);
    void current.onEnter?.();
  }

  navigate('verify');
}
