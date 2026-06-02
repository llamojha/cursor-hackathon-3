export type OutfitTierId = 'pajamas' | 'casual' | 'puttogether' | 'runway';

export type OutfitTier = {
  id: OutfitTierId;
  label: string;
  min: number;
  max: number;
};

export const OUTFIT_TIERS: readonly OutfitTier[] = [
  { id: 'pajamas', label: 'Just rolled out of bed', min: 0, max: 24 },
  { id: 'casual', label: 'Casual cool', min: 25, max: 49 },
  { id: 'puttogether', label: 'Put-together', min: 50, max: 74 },
  { id: 'runway', label: 'Runway ready', min: 75, max: 100 },
];

export const OUTFIT_TIER_EMOJI: Record<OutfitTierId, string> = {
  pajamas: '🛌',
  casual: '👕',
  puttogether: '✨',
  runway: '🔥',
};

export const OUTFIT_TIER_ROASTS: Record<OutfitTierId, readonly string[]> = {
  pajamas: [
    'Zero accessories. This isn’t an outfit, it’s a hostage situation.',
    'The fit said “I have given up, and so should you.”',
    'Detected: the exact energy of answering the door for a food delivery.',
    'This is “I’ll just throw something on” used as a threat.',
    'You’re not underdressed, you’re pre-dressed. Keep going, champ.',
  ],
  casual: [
    'Mid. Aggressively, confidently, unapologetically mid.',
    'The outfit equivalent of a shrug emoji. 🤷',
    'Not bad, not good, not memorable. A beige flag in human form.',
    'Dressed for “sprint to the corner store praying no one sees me.”',
    'One accessory away from having a whole personality. So close.',
  ],
  puttogether: [
    'Oh, effort! Someone wants to be perceived. We respect the audacity.',
    'This is “I knew I’d be on camera” energy and it’s loud.',
    'Coordinated enough to fool people who don’t know you. Bravo.',
    'Dressing like the rent is paid and the trauma is processed. Lies, but cute.',
  ],
  runway: [
    'Okay supermodel, the rest of us are in pajamas. Read the room.',
    'Fully accessorized. Genuine question — who is this for?',
    'This is “I’ll just be ten minutes” that took two hours. We can tell.',
    'Serving a full look to a webcam at a hackathon. Iconic. Unwell. Iconic.',
  ],
};

export const OUTFIT_WAITING_ROAST =
  'We can’t roast thin air. Get in frame, coward.';

/** Framing feedback (from the person box) — wins over tier roasts when bad. */
export const FRAMING_ROASTS: Record<'far' | 'close' | 'offcenter', string> = {
  far: 'Step closer — we can’t rate a fit we can’t see. You’re a speck.',
  close: 'Whoa, nostril cam. Back up — this is a fit check, not a dermatology appointment.',
  offcenter: 'Center yourself. You’re half-cropped like a guilty dating-profile pic.',
};

export type OutfitRoast = {
  match: (counts: Readonly<Record<string, number>>) => boolean;
  line: string;
};

export const OUTFIT_CONTEXTUAL_ROASTS: readonly OutfitRoast[] = [
  {
    match: (c) => (c.tie ?? 0) >= 1,
    line: 'A tie. At a hackathon. You’re either closing a deal or lying to someone.',
  },
  {
    match: (c) => (c.handbag ?? 0) >= 1 && (c.umbrella ?? 0) >= 1,
    line: 'Bag AND umbrella — prepared for everything except being perceived this hard.',
  },
  {
    match: (c) => (c.suitcase ?? 0) >= 1,
    line: 'A suitcase? Bold to pack before the first date even ends in disaster.',
  },
  {
    match: (c) => (c.backpack ?? 0) >= 1,
    line: 'Backpack on. Are we going on an adventure or did you forget to grow up?',
  },
  {
    match: (c) => (c['cell phone'] ?? 0) >= 1,
    line: 'Phone welded to the hand. The fit’s fine; the attachment style is the red flag.',
  },
  {
    match: (c) => (c.person ?? 0) >= 2,
    line: 'Group shot. Statistically, one of you is the “before” photo.',
  },
];

/** Per-item labels for the "Why?" receipt. */
export const OUTFIT_ITEM_LABELS: Record<string, string> = {
  tie: 'dressed to impress',
  handbag: 'accessorized',
  backpack: 'adventure-ready',
  umbrella: 'weather-prepared',
  suitcase: 'going somewhere',
};
