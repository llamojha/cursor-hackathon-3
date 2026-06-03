// Shared contract for ToxiCheck screens. Each screen is an isolated module
// that implements ScreenFactory and only edits its own files.

export type ScreenId =
  | 'splash'
  | 'verify'
  | 'outfit'
  | 'score'
  | 'matches'
  | 'quiz'
  | 'chat';

/** One scored item shown in the outfit analysis (object → red-flag points). */
export type OutfitItem = { label: string; delta: number };

export type Analysis = {
  photo: string; // data URL of the frozen frame
  outfitItems: OutfitItem[]; // things in frame and their red-flag points
  outfitFlagScore: number; // 0..100
  toxicityScore: number; // 0..100
  toxicityType: string; // e.g. 'GHOSTEADOR SERIAL'
  redFlags: string[]; // ~5 sardonic explanations (Spanish)
  visionLines: string[]; // raw vision findings (Spanish)
};

export type Match = {
  name: string;
  age: number;
  score: number;
  type: string;
  why: string;
};

export type AppState = {
  analysis: Analysis | null;
  matches: Match[];
  quizCorrect: number;
};

/** Camera + AI service shared by the verify/outfit/score screens. */
export type Engine = {
  ready: Promise<void>;
  /** Start the front camera into the given <video> and begin detecting. */
  attachCamera(video: HTMLVideoElement): Promise<void>;
  stopCamera(): void;
  /** Live COCO class counts for the current frame (verify indicator). */
  liveCounts(): Record<string, number>;
  /** Freeze the frame, score it, and run server vision → an Analysis. */
  capture(video: HTMLVideoElement): Promise<Analysis>;
};

export type ScreenContext = {
  navigate(to: ScreenId): void;
  state: AppState;
  engine: Engine;
};

export type ScreenInstance = {
  el: HTMLElement;
  onEnter?(): void | Promise<void>;
  onLeave?(): void;
};

export type ScreenFactory = (ctx: ScreenContext) => ScreenInstance;
