import OpenAI from 'openai';
import { getProfileWithPhone } from './profiles.js';

const MIN_ROAST_CHARS = 24;
const MAX_ROAST_CHARS = 1200;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada en el servidor');
  }
  return new OpenAI({ apiKey });
}

function minBrutalityForToxicity(toxicityScore) {
  const t = Math.max(0, Math.min(100, Number(toxicityScore) || 50));
  return Math.min(9, 5.5 + t / 25);
}

function minRedFlagHits(redFlags) {
  const n = redFlags.length;
  if (n <= 1) return 1;
  return Math.ceil(n * 0.5);
}

const JUDGE_SYSTEM = `Eres el jurado de una app de citas satírica en España llamada "Roast Match".
Tu trabajo es evaluar si un roast escrito por un usuario es lo bastante mordaz ("cabrón" en tono de humor ácido, no violencia real)
Y si demuestra que ha leído las red flags del perfil (referencias claras, metáforas o ataques directos a esos puntos).

Reglas:
- humor negro y sarcasmo están bien; incitación al odio, amenazas o insultos a grupos protegidos = fallo automático
- "suficientemente cabrón" = brutalidad >= umbral que te pasamos según toxicidad del perfil
- red flags cubiertas: cuenta cuántas de la lista el roast ataca de forma reconocible (sinónimos cuentan)
- Responde SOLO JSON válido con este esquema:
{
  "passed": boolean,
  "brutalityScore": number (1-10),
  "redFlagsHit": string[] (texto exacto de las red flags de la lista que cubrió),
  "feedback": string (2-3 frases en español, tono de presentador de roast),
  "reason": string (breve, por qué pasó o falló)
}`;

/**
 * @param {{ profileId: string, roast: string }} input
 */
export async function validateRoast({ profileId, roast }) {
  const profile = getProfileWithPhone(profileId);
  if (!profile) {
    return { ok: false, error: 'Perfil no encontrado' };
  }

  const text = String(roast ?? '').trim();
  if (text.length < MIN_ROAST_CHARS) {
    return {
      ok: true,
      passed: false,
      feedback: 'Eso ni es un roast, es un susurro. Escribe algo con más mala leche.',
      reason: 'demasiado_corto',
      brutalityScore: 0,
      redFlagsHit: [],
      requiredBrutality: minBrutalityForToxicity(profile.toxicityScore),
      requiredRedFlagHits: minRedFlagHits(profile.redFlags),
    };
  }
  if (text.length > MAX_ROAST_CHARS) {
    return { ok: false, error: 'Roast demasiado largo' };
  }

  const requiredBrutality = minBrutalityForToxicity(profile.toxicityScore);
  const requiredRedFlagHits = minRedFlagHits(profile.redFlags);

  let verdict;
  try {
    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_ROAST_MODEL || 'gpt-4o-mini',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: JUDGE_SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({
            profileName: profile.displayName,
            toxicityScore: profile.toxicityScore,
            requiredBrutalityMin: requiredBrutality,
            requiredRedFlagHitsMin: requiredRedFlagHits,
            redFlagsFromAI: profile.redFlags,
            userRoast: text,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('Respuesta vacía de OpenAI');
    verdict = JSON.parse(raw);
  } catch (err) {
    console.error('[roast] OpenAI error:', err);
    return {
      ok: false,
      error:
        err instanceof Error && err.message.includes('OPENAI_API_KEY')
          ? err.message
          : 'No se pudo validar el roast. Revisa OPENAI_API_KEY.',
    };
  }

  const brutalityScore = clamp(Number(verdict.brutalityScore) || 0, 0, 10);
  const redFlagsHit = mergeRedFlagHits(text, profile.redFlags, verdict.redFlagsHit);

  const brutalEnough = brutalityScore >= requiredBrutality;
  const flagsEnough = redFlagsHit.length >= requiredRedFlagHits;
  const hateFail = /odio|amenaza|violencia real|grupo protegid/i.test(
    `${verdict.reason || ''} ${verdict.feedback || ''}`,
  );

  const passed = brutalEnough && flagsEnough && !hateFail;

  const result = {
    ok: true,
    passed,
    brutalityScore,
    redFlagsHit,
    requiredBrutality,
    requiredRedFlagHits,
    feedback: String(verdict.feedback || '').slice(0, 500) || defaultFeedback(passed),
    reason: String(verdict.reason || '').slice(0, 300),
  };

  if (passed) {
    result.phone = profile.phone;
    result.matchedProfileId = profile.id;
    result.matchedName = profile.displayName;
  }

  return result;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function defaultFeedback(passed) {
  return passed
    ? 'Roast aprobado. Has sido lo bastante cabrón.'
    : 'Necesitas más veneno y menos cumplido disfrazado.';
}

/** @param {unknown} aiHits */
function mergeRedFlagHits(roast, redFlags, aiHits) {
  const hit = new Set();
  if (Array.isArray(aiHits)) {
    for (const f of aiHits) {
      if (typeof f === 'string' && redFlags.includes(f)) hit.add(f);
    }
  }
  const lower = roast.toLowerCase();
  for (const flag of redFlags) {
    if (hit.has(flag)) continue;
    const words = flag
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 5);
    const matches = words.filter((w) => lower.includes(w)).length;
    if (matches >= Math.min(2, words.length)) hit.add(flag);
  }
  return [...hit];
}
