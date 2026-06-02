export type ToxicTierId = 'green' | 'beige' | 'yellow' | 'toxic';

export type ToxicTier = {
  id: ToxicTierId;
  label: string;
  min: number;
  max: number;
};

export const TOXIC_TIERS: readonly ToxicTier[] = [
  { id: 'green', label: 'Certified green flag', min: 0, max: 24 },
  { id: 'beige', label: 'Beige flag — proceed with snacks', min: 25, max: 49 },
  { id: 'yellow', label: 'Yellow flag factory', min: 50, max: 74 },
  { id: 'toxic', label: 'Toxic hazard', min: 75, max: 100 },
];

export const TIER_EMOJI: Record<ToxicTierId, string> = {
  green: '✅',
  beige: '🫤',
  yellow: '🚩',
  toxic: '☠️',
};

export const TIER_ROASTS: Record<ToxicTierId, readonly string[]> = {
  green: [
    'Objectively low chaos. Boring? Maybe. Safe? Allegedly.',
    'No major red props. The bar is on the floor and you cleared it.',
  ],
  beige: [
    'Some suspicious items. Not evil, just… chronically online.',
    'Mild ick potential. Like liking your own story.',
  ],
  yellow: [
    'Multiple warning signs. Your situationship is taking notes.',
    'The camera is concerned. So are we, lovingly.',
  ],
  toxic: [
    'Peak red-flag props. This frame needs a content warning.',
    'Toxicity maxed out. Run the prop hunt in reverse — hide everything.',
  ],
};

export const POINT_CAMERA_ROAST =
  'Point the camera — we need evidence before the toxic verdict.';

export type ContextualRoast = {
  match: (counts: Readonly<Record<string, number>>) => boolean;
  line: string;
};

export const CONTEXTUAL_ROASTS: readonly ContextualRoast[] = [
  {
    match: (c) => (c['cell phone'] ?? 0) >= 1 && (c.laptop ?? 0) >= 1,
    line: 'Phone AND laptop — you date devices, not people.',
  },
  {
    match: (c) => (c['cell phone'] ?? 0) >= 2,
    line: 'Two phones. Are you juggling situations or running a scam?',
  },
  {
    match: (c) => (c.person ?? 0) >= 2,
    line: 'Multiple humans detected. Toxic prediction: commitment issues (joking).',
  },
  {
    match: (c) => (c.person ?? 0) === 0 && (c['cell phone'] ?? 0) >= 1,
    line: 'Phone with no face — texting from the void. Classic.',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c['cell phone'] ?? 0) >= 1,
    line: 'You plus phone: main character in “left on read” universe.',
  },
  {
    match: (c) => (c.laptop ?? 0) >= 1 && (c.person ?? 0) <= 1,
    line: 'Work laptop energy. Your toxic trait is “one more email.”',
  },
];

export const RED_FLAG_LABELS: Record<string, string> = {
  'cell phone': 'phone addict',
  laptop: 'chronically employed',
  person: 'too many humans',
  bottle: 'messy night',
  'wine glass': 'dramatic pours',
  tv: 'weaponized rotting',
  couch: 'bare minimum effort',
};
