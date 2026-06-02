// Combined verdict roasts — play the outfit score against the toxicity score.
const HOT_TOXIC = [
  'Dressed like a snack, behaves like a red flag. Iconic disaster.',
  'The fit says “date me,” the props say “run.” Both are correct.',
  'Gorgeous packaging, cursed contents. A scam, but a well-dressed one.',
];

const HOT_SAFE = [
  'Hot AND low-drama? Suspicious. We’re calling your ex to confirm.',
  'Great fit, clean vibes. Are you a houseplant in human form? Be honest.',
  'Put-together and harmless. Statistically, you do not exist.',
];

const MID_TOXIC = [
  'Bad fit AND toxic? At least you’re consistent across every axis.',
  'Ugly vibes inside and out. Efficient, honestly.',
  'No drip and a red flag. The full anti-glow-up package.',
];

const MID_SAFE = [
  'Boring but harmless — the human equivalent of plain oatmeal.',
  'No drama, no fit, no notes. A beige flag in cargo shorts.',
  'Inoffensive on all fronts. You’d survive me, but barely entertain me.',
];

const WAITING = 'Get fully in frame so we can judge the whole disaster.';

function rotate(pool: readonly string[], now: number): string {
  return pool[Math.floor(now / 8000) % pool.length]!;
}

/** Pick a combined roast from the two scores (≥50 = "hot" / "toxic"). */
export function combinedRoast(
  outfit: number,
  toxic: number,
  waiting: boolean,
  now = performance.now(),
): string {
  if (waiting) return WAITING;
  const hot = outfit >= 50;
  const tox = toxic >= 50;
  if (hot && tox) return rotate(HOT_TOXIC, now);
  if (hot) return rotate(HOT_SAFE, now);
  if (tox) return rotate(MID_TOXIC, now);
  return rotate(MID_SAFE, now);
}
