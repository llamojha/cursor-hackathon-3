export type DateableTierId = 'needs-work' | 'introvert' | 'dateable' | 'main-character';

export type DateableTier = {
  id: DateableTierId;
  label: string;
  min: number;
  max: number;
};

export const DATEABLE_TIERS: readonly DateableTier[] = [
  { id: 'needs-work', label: 'Profile loading…', min: 0, max: 24 },
  { id: 'introvert', label: "It's giving introvert", min: 25, max: 49 },
  { id: 'dateable', label: 'Dateable', min: 50, max: 74 },
  { id: 'main-character', label: 'Main character (single)', min: 75, max: 100 },
];

export const TIER_ROASTS: Record<DateableTierId, readonly string[]> = {
  'needs-work': [
    'The algorithm cannot find you. Are you a ghost or just camera-shy?',
    'Low dateable energy. Step in frame like you mean it.',
  ],
  introvert: [
    'Valid vibe. Your plants know more about you than strangers.',
    'Dateable potential loading… bring one human and fewer tabs.',
  ],
  dateable: [
    'One person, decent props, phone not winning — suspiciously put together.',
    'You look like you would reply within 24 hours. Iconic.',
  ],
  'main-character': [
    'Solo shot, charm props, no doom-scrolling in frame. Hire you as a rom-com lead.',
    'Peak single energy: present, polished, not on a work call.',
  ],
};

export const POINT_CAMERA_ROAST =
  'Solo mode: point the camera at you (one person in frame).';

export type ContextualRoast = {
  match: (counts: Readonly<Record<string, number>>) => boolean;
  line: string;
};

export const CONTEXTUAL_ROASTS: readonly ContextualRoast[] = [
  {
    match: (c) => (c.person ?? 0) === 0,
    line: 'Nobody detected — we cannot rate an empty chair.',
  },
  {
    match: (c) => (c.person ?? 0) >= 2,
    line: 'Squad detected. This score is for singles only — fly solo for a sec.',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c['cell phone'] ?? 0) >= 1,
    line: 'You are in frame but so is your phone. Your dateable score is texting someone else.',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c.laptop ?? 0) >= 1,
    line: 'Work mode unlocked. LinkedIn breath is not dateable (allegedly).',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c.book ?? 0) >= 1,
    line: 'Dateable and has opinions. Respect.',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c['potted plant'] ?? 0) >= 1,
    line: 'Soft launch ready. Plant parent energy reads well.',
  },
];

// Back-compat aliases for date-score.ts exports
export type DateTierId = DateableTierId;
export type DateTier = DateableTier;
export const DATE_TIERS = DATEABLE_TIERS;
