import type { Detection } from 'libreyolo-web';
import type { ToxicReceiptLine } from '../toxic-score';

export type MinigameId = 'score' | 'toxic' | 'prop-hunt' | 'outfit' | 'combined';

/** One score column for modes that report more than one metric. */
export type ScoreBlock = {
  label: string;
  value: string;
  tier: string;
  tierId: string;
  meterPercent: number;
};

export type MinigamePanel = {
  kicker: string;
  primary: string;
  secondary: string;
  roast: string;
  tierId: string;
  meterPercent: number;
  subtitle?: string;
  receipt?: ToxicReceiptLine[];
  receiptFooter?: string;
  /** Dual/multi-score layout; single-score modes leave this undefined. */
  blocks?: ScoreBlock[];
};

export type FrameSize = { width: number; height: number };

export interface Minigame {
  readonly id: MinigameId;
  reset(): void;
  onFrame(
    detections: readonly Detection[],
    now: number,
    frame?: FrameSize,
  ): MinigamePanel;
}

export const MINIGAME_LABELS: Record<MinigameId, string> = {
  score: 'Dateable score',
  toxic: 'Toxic prediction',
  'prop-hunt': 'Prop hunt',
  outfit: 'Outfit check',
  combined: 'Outfit + Toxicity',
};
