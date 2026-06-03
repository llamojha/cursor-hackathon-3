import type { RoastProfile } from './profiles';

// Validación del roast HARDCODEADA en el navegador (sin OpenAI):
//  - "brutalidad": heurística por longitud + palabras con mala leche
//  - "red flags clavadas": coincidencia de palabras clave con las del perfil
//  - umbrales escalan con la toxicidad del perfil

const MIN_ROAST_CHARS = 24;
const MAX_ROAST_CHARS = 1200;

const VENOM_WORDS = [
  'patétic',
  'ridícul',
  'vergüenza',
  'cringe',
  'penos',
  'triste',
  'desastre',
  'fracaso',
  'inseguro',
  'postureo',
  'ego',
  'fantasma',
  'ghost',
  'visto',
  'red flag',
  'tóxic',
  'insufrible',
  'alquiler',
  'ex',
  'gimnasio',
  'gafas',
  'cadena',
  'dentista',
  'espejo',
  'drama',
  'llora',
  'soledad',
  'narcis',
];

export type RoastVerdict = {
  passed: boolean;
  brutalityScore: number;
  requiredBrutality: number;
  redFlagsHit: string[];
  requiredRedFlagHits: number;
  feedback: string;
  reason: string;
  phone?: string;
  matchedName?: string;
  error?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function minBrutalityForToxicity(toxicityScore: number): number {
  const t = clamp(Number(toxicityScore) || 50, 0, 100);
  return Math.min(9, 5.5 + t / 25);
}

function minRedFlagHits(redFlags: string[]): number {
  const n = redFlags.length;
  if (n <= 1) return 1;
  return Math.ceil(n * 0.5);
}

/** Heurística local de "mala leche" 0-10. */
function brutalityHeuristic(text: string): number {
  const lower = text.toLowerCase();
  let score = Math.min(5.5, text.length / 45); // longitud → hasta ~5.5
  for (const w of VENOM_WORDS) if (lower.includes(w)) score += 0.7;
  const exclaims = (text.match(/!/g) ?? []).length;
  score += Math.min(1, exclaims * 0.4);
  const shouty = (text.match(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g) ?? []).length;
  score += Math.min(1, shouty * 0.5);
  return clamp(score, 0, 10);
}

/** Cuenta red flags "clavadas" por coincidencia de palabras significativas. */
function countRedFlagHits(roast: string, redFlags: string[]): string[] {
  const lower = roast.toLowerCase();
  const hit: string[] = [];
  for (const flag of redFlags) {
    const words = flag
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 5);
    const matches = words.filter((w) => lower.includes(w)).length;
    if (matches >= Math.min(2, words.length)) hit.push(flag);
  }
  return hit;
}

export function validateRoast(profile: RoastProfile, roast: string): RoastVerdict {
  const text = roast.trim();
  const requiredBrutality = minBrutalityForToxicity(profile.toxicityScore);
  const requiredRedFlagHits = minRedFlagHits(profile.redFlags);

  if (text.length < MIN_ROAST_CHARS) {
    return {
      passed: false,
      brutalityScore: 0,
      requiredBrutality,
      redFlagsHit: [],
      requiredRedFlagHits,
      feedback: 'Eso ni es un roast, es un susurro. Escribe algo con más mala leche.',
      reason: 'demasiado_corto',
    };
  }
  if (text.length > MAX_ROAST_CHARS) {
    return {
      passed: false,
      brutalityScore: 0,
      requiredBrutality,
      redFlagsHit: [],
      requiredRedFlagHits,
      feedback: 'Demasiado largo. Es un roast, no tu TFM.',
      reason: 'demasiado_largo',
    };
  }

  const brutalityScore = brutalityHeuristic(text);
  const redFlagsHit = countRedFlagHits(text, profile.redFlags);

  // Veto por discurso de odio real (no humor): fallo automático.
  const hateFail = /(matar|muerte a|odio a los|nazi|violar)/i.test(text);

  const brutalEnough = brutalityScore >= requiredBrutality;
  const flagsEnough = redFlagsHit.length >= requiredRedFlagHits;
  const passed = brutalEnough && flagsEnough && !hateFail;

  let feedback: string;
  if (hateFail) {
    feedback = 'Eso no es humor ácido, es ser un cretino. Roast invalidado.';
  } else if (passed) {
    feedback = '¡Match! Suficiente veneno y has clavado sus red flags. El jurado aplaude.';
  } else if (!flagsEnough && brutalEnough) {
    feedback = 'Mala leche sí, pero ni mencionaste sus red flags. Lee el perfil, cariño.';
  } else if (flagsEnough && !brutalEnough) {
    feedback = 'Apuntas a las red flags pero con guante de seda. Más cabrón.';
  } else {
    feedback = 'Ni veneno ni puntería. Esto fue un cumplido disfrazado.';
  }

  const verdict: RoastVerdict = {
    passed,
    brutalityScore,
    requiredBrutality,
    redFlagsHit,
    requiredRedFlagHits,
    feedback,
    reason: passed ? 'aprobado' : hateFail ? 'odio' : 'insuficiente',
  };
  if (passed) {
    verdict.phone = profile.phone;
    verdict.matchedName = profile.displayName;
  }
  return verdict;
}
