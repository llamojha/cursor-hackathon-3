import type { Detection } from 'libreyolo-web';
import { scoreHandshake } from './detection';

export interface CaptchaChallenge {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  failMessages: string[];
  successMessage: string;
  emoji: string;
}

const PERSON = 0;
const BOTTLE = 39;
const CUP = 41;
const BANANA = 46;
const APPLE = 47;
const ORANGE = 49;
const LAPTOP = 63;
const PHONE = 67;
const BOOK = 73;
const CLOCK = 74;
const SCISSORS = 76;
const TEDDY = 77;

export const COMMUNION_WATCH_ID = 'communion-watch';
export const GERONIMO_STILTON_ID = 'geronimo-stilton';
export const CHILDHOOD_TEDDY_ID = 'childhood-teddy';
export const NO_INNER_CHILD_ID = 'no-inner-child';

export interface CaptchaChoice {
  id: string;
  label: string;
  subtitle: string;
  emoji: string;
}

export const CAPTCHA_CHOICES: CaptchaChoice[] = [
  {
    id: COMMUNION_WATCH_ID,
    label: 'Reloj de comunión',
    subtitle: 'Cara + reloj sagrado en la misma toma.',
    emoji: '⌚',
  },
  {
    id: GERONIMO_STILTON_ID,
    label: 'Libro de Geronimo Stilton',
    subtitle: 'Demuestra que leíste (o al menos tenías) Ratón Reportero.',
    emoji: '🐭',
  },
  {
    id: CHILDHOOD_TEDDY_ID,
    label: 'Peluche de infancia',
    subtitle: 'Ese que sobrevivió a mudanzas, exes y la adultez.',
    emoji: '🧸',
  },
  {
    id: NO_INNER_CHILD_ID,
    label: 'Ningún objeto',
    subtitle: 'No tienes niño interior. Solo cara. Qué maduro.',
    emoji: '😐',
  },
];

const COMMUNION_WATCH_CHALLENGE: CaptchaChallenge = {
  id: COMMUNION_WATCH_ID,
  title: 'Prueba de comunión',
  instruction:
    'Enséñanos tu reloj de la comunión junto a la cara. Fe, elegancia y visión por computador.',
  hint: 'Selfie: cara + reloj juntos. Sujétalo junto a la mejilla, no abajo.',
  failMessages: [
    '¿Perdiste el reloj en el salón parroquial de 2008?',
    'Vemos cara o reloj, no el combo sagrado.',
    'Eso parece un Casio. Buscamos comunión, no piscina.',
    'El cura no aprueba esta toma. Reintenta.',
  ],
  successMessage: 'Comunión verificada. Entras al cielo… y a la web.',
  emoji: '⌚',
};

const GERONIMO_STILTON_CHALLENGE: CaptchaChallenge = {
  id: GERONIMO_STILTON_ID,
  title: 'Prueba Ratón Reportero',
  instruction:
    'Enséñanos un Geronimo Stilton (o cualquier libro; la IA no lee títulos, pero nosotros sí sabemos la verdad).',
  hint: 'Tapa colorida, ratón visible, olor a queso opcional.',
  failMessages: [
    '¿Eso es un Kindle con PDF pirata? Sospechoso.',
    'Cero páginas detectadas. ¿Solo lo viste en TikTok?',
    'Eso parece una caja de cereales. Casi, pero no.',
    'Geronimo estaría decepcionado. Y eso duele.',
  ],
  successMessage: '¡Cheese balls! Lector verificado. Geronimo aprueba este acceso.',
  emoji: '🐭',
};

const CHILDHOOD_TEDDY_CHALLENGE: CaptchaChallenge = {
  id: CHILDHOOD_TEDDY_ID,
  title: 'Prueba del peluche sagrado',
  instruction:
    'Muéstranos tu peluche de infancia. El que aún te juzga en silencio desde el armario.',
  hint: 'Oso, conejito, lo que te dieron antes de saber lo que era la hipoteca.',
  failMessages: [
    '¿Eso es una almohada? El niño interior pone los ojos en blanco.',
    'Cero ternura detectada. ¿Lo vendiste en Wallapop?',
    'Los bots no abrazan. Tú tampoco, al parecer.',
    'Necesitamos peluche, no calcetín enrollado.',
  ],
  successMessage: 'Peluche autenticado. Tu niño interior firma con garabatos.',
  emoji: '🧸',
};

const NO_INNER_CHILD_CHALLENGE: CaptchaChallenge = {
  id: NO_INNER_CHILD_ID,
  title: 'Prueba sin niño interior',
  instruction:
    'Demuestra que eres un adulto funcional: solo tu cara. Nada de peluches, relojes ni libros. Vacío existencial permitido.',
  hint: 'Cara a cámara. Manos vacías. Cero objetos de consuelo emocional.',
  failMessages: [
    'Detectamos ternura. Eso implica niño interior. Prohibido.',
    '¿Escondes un peluche fuera de cuadro? La IA sospecha.',
    'Objeto detectado. Elige otro botón si quieres enseñar cosas.',
    'Demasiado simbólico para alguien sin infancia interior.',
  ],
  successMessage: 'Adulto emocionalmente minimalista verificado. Bienvenido, sobreviviente.',
  emoji: '😐',
};

const CHALLENGE_BY_ID: Record<string, CaptchaChallenge> = {
  [COMMUNION_WATCH_ID]: COMMUNION_WATCH_CHALLENGE,
  [GERONIMO_STILTON_ID]: GERONIMO_STILTON_CHALLENGE,
  [CHILDHOOD_TEDDY_ID]: CHILDHOOD_TEDDY_CHALLENGE,
  [NO_INNER_CHILD_ID]: NO_INNER_CHILD_CHALLENGE,
};

export function getChallengeById(id: string): CaptchaChallenge | undefined {
  return CHALLENGE_BY_ID[id] ?? CAPTCHA_CHALLENGES.find((c) => c.id === id);
}

export function pickChosenChallenge(choiceId: string): CaptchaChallenge[] {
  const challenge = getChallengeById(choiceId);
  if (!challenge) return pickCaptchaRound(1);
  return [challenge];
}

/** Solo cara visible y sin peluche u objetos de consuelo en cuadro. */
function scoreNoInnerChild(detections: Detection[], width: number, height: number): number {
  const person = personScore(detections, width, height, 0.06);
  if (person < 0.32) return person * 0.45;

  const plush = objectScore(bestOfClass(detections, [TEDDY], 0.22), width, height, 0.008);
  const book = objectScore(bestOfClass(detections, [BOOK], 0.22), width, height, 0.008);
  const clock = objectScore(bestOfClass(detections, [CLOCK], 0.22), width, height, 0.008);

  const comfortObjects = detections.filter(
    (d) =>
      d.confidence >= 0.24 &&
      [TEDDY, BOOK, CLOCK, PHONE, CUP, BOTTLE].includes(d.classId),
  );
  const clutter = Math.max(plush, book, clock);

  if (comfortObjects.length > 0 || clutter > 0.22) {
    return Math.min(person * 0.4, 0.38);
  }

  return Math.min(1, person * 0.92);
}

function bestOfClass(detections: Detection[], classIds: number[], minConf = 0.38) {
  return detections
    .filter((d) => classIds.includes(d.classId) && d.confidence >= minConf)
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}

function personScore(detections: Detection[], width: number, height: number, minArea = 0.07) {
  const people = detections.filter((d) => d.classId === PERSON && d.confidence >= 0.35);
  if (!people.length) return 0;
  const main = people.sort(
    (a, b) =>
      (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) -
      (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]),
  )[0];
  const area = ((main.bbox[2] - main.bbox[0]) * (main.bbox[3] - main.bbox[1])) / (width * height);
  const [cx, cy] = [(main.bbox[0] + main.bbox[2]) / 2, (main.bbox[1] + main.bbox[3]) / 2];
  const centered = cx > width * 0.18 && cx < width * 0.82 && cy > height * 0.12 && cy < height * 0.88;
  if (!centered || area < minArea) return main.confidence * 0.25;
  return Math.min(1, main.confidence * Math.min(1.2, area * 5));
}

function objectScore(det: Detection | null, width: number, height: number, minArea = 0.012) {
  if (!det) return 0;
  const [w, h] = [det.bbox[2] - det.bbox[0], det.bbox[3] - det.bbox[1]];
  const area = (w * h) / (width * height);
  const [cx, cy] = [(det.bbox[0] + det.bbox[2]) / 2, (det.bbox[1] + det.bbox[3]) / 2];
  const visible = area > minArea && area < 0.65;
  const inFrame = cx > width * 0.08 && cx < width * 0.92 && cy > height * 0.08 && cy < height * 0.92;
  if (!visible || !inFrame) return det.confidence * 0.3;
  return Math.min(1, det.confidence * (0.75 + Math.min(0.25, area * 8)));
}

function bboxCenter(bbox: [number, number, number, number]) {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] as const;
}

function pointInRect(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

export interface CommunionWatchDebug {
  person: number;
  watch: number;
  pose: number;
  faceOk: boolean;
  hint: string;
}

/** COCO no tiene "reloj de pulsera": usamos zona junto a la cara + objetos pequeños + pose. */
export function scoreCommunionWatch(
  detections: Detection[],
  width: number,
  height: number,
): { score: number; debug: CommunionWatchDebug } {
  const people = detections.filter((d) => d.classId === PERSON && d.confidence >= 0.3);
  const empty: CommunionWatchDebug = {
    person: 0,
    watch: 0,
    pose: 0,
    faceOk: false,
    hint: 'Acércate a la cámara: necesitamos ver tu cara.',
  };
  if (!people.length) return { score: 0, debug: empty };

  const main = people.sort(
    (a, b) =>
      (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) -
      (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]),
  )[0];

  const personW = main.bbox[2] - main.bbox[0];
  const personH = main.bbox[3] - main.bbox[1];
  const area = (personW * personH) / (width * height);
  const [pcx, pcy] = bboxCenter(main.bbox);

  // Selfie: cara en cuadro aunque el bbox empiece un poco más abajo
  const faceOk =
    main.bbox[1] < height * 0.62 &&
    personH > height * 0.1 &&
    area > 0.035 &&
    pcy > height * 0.15 &&
    pcy < height * 0.82;

  const person =
    faceOk && main.confidence >= 0.32
      ? Math.min(1, main.confidence * Math.min(1.15, area * 4.5))
      : main.confidence * 0.28;

  if (!faceOk || person < 0.28) {
    return {
      score: person * 0.35,
      debug: { person, watch: 0, pose: 0, faceOk, hint: empty.hint },
    };
  }

  // Zona donde suele ir el reloj al enseñarlo: junto a la cara, no abajo
  const faceZone = {
    x1: main.bbox[0] - personW * 0.45,
    x2: main.bbox[2] + personW * 0.65,
    y1: main.bbox[1] - personH * 0.15,
    y2: main.bbox[1] + personH * 0.62,
  };

  const heldItemClasses = [CLOCK, PHONE, CUP, BOTTLE, BOOK, SCISSORS, 65, 66, 68]; // remote, keyboard, microwave…

  let watch = objectScore(bestOfClass(detections, [CLOCK], 0.18), width, height, 0.001);

  for (const d of detections) {
    if (d.classId === PERSON || d.confidence < 0.22) continue;
    const [cx, cy] = bboxCenter(d.bbox);
    const [ow, oh] = [d.bbox[2] - d.bbox[0], d.bbox[3] - d.bbox[1]];
    const objArea = (ow * oh) / (width * height);
    if (objArea < 0.0008 || objArea > 0.28) continue;

    const inFaceZone = pointInRect(cx, cy, faceZone.x1, faceZone.y1, faceZone.x2, faceZone.y2);
    const overlapsFace = !(
      d.bbox[2] < main.bbox[0] - personW * 0.5 ||
      d.bbox[0] > main.bbox[2] + personW * 0.5 ||
      d.bbox[3] < main.bbox[1] - personH * 0.2 ||
      d.bbox[1] > main.bbox[1] + personH * 0.65
    );

    if (inFaceZone || overlapsFace) {
      const boost = heldItemClasses.includes(d.classId) ? 1 : 0.82;
      watch = Math.max(watch, Math.min(1, d.confidence * boost * (0.7 + Math.min(0.3, objArea * 12))));
    }
  }

  // Brazo extendido enseñando el reloj: bbox ancho o persona muy cerca
  const aspect = personW / Math.max(personH, 1);
  const widePose = aspect > 0.68 && area > 0.055;
  const closeSelfie = area > 0.14 && personH > height * 0.22;
  const armShowing = personW / width > 0.32 && area > 0.06;
  const pose = widePose ? 0.62 : armShowing ? 0.52 : closeSelfie ? 0.45 : 0;

  const watchSignal = Math.max(watch, pose);
  let hint = 'Perfecto: cara detectada. Acerca el reloj junto a la mejilla.';
  if (watchSignal >= 0.35) hint = '¡Reloj en zona! Mantén quieto un segundo…';
  else if (watch > 0.12) hint = 'Casi: sujeta el reloj más cerca de la cara.';
  else if (pose > 0.35) hint = 'Enseña el reloj hacia la cámara, brazo un poco más visible.';

  const score =
    watchSignal < 0.2
      ? Math.min(person, watchSignal + 0.12) * 0.48
      : Math.min(1, person * 0.42 + watchSignal * 0.58);

  return { score, debug: { person, watch, pose, faceOk, hint } };
}

export const CAPTCHA_CHALLENGES: CaptchaChallenge[] = [
  COMMUNION_WATCH_CHALLENGE,
  GERONIMO_STILTON_CHALLENGE,
  CHILDHOOD_TEDDY_CHALLENGE,
  NO_INNER_CHILD_CHALLENGE,
  {
    id: 'breathe',
    title: 'Prueba de respiración',
    instruction: 'Demuestra que respiras oxígeno, no tokens. Aparece frente a la cámara.',
    hint: 'Una cara humana ayuda. Una foto de Beyoncé, no.',
    failMessages: [
      '¿Eres un fantasma digital?',
      'La IA detectó 0% de carne. Inténtalo otra vez.',
      '¿Estás escondido detrás del monitor?',
    ],
    successMessage: 'Confirmado: contiene carbono y opiniones.',
    emoji: '🫁',
  },
  {
    id: 'phone',
    title: 'Prueba de smartphone',
    instruction: 'Los bots usan APIs. Muéstranos tu móvil de carne y hueso (pantalla rota opcional).',
    hint: 'Sujétalo frente a la cámara unos segundos.',
    failMessages: [
      'Eso parece un Nokia del 2004 dibujado en Paint.',
      '¿Un bot sin móvil? Qué triste existencia.',
      'No vemos ningún dispositivo. ¿Telepatía?',
    ],
    successMessage: 'Dispositivo humano detectado. Probablemente con WhatsApp abierto.',
    emoji: '📱',
  },
  {
    id: 'drink',
    title: 'Prueba de hidratación',
    instruction: 'Un humano funcional necesita líquidos. Enséñanos tu bebida.',
    hint: 'Taza, botella, vaso… lo que tengas a mano.',
    failMessages: [
      'Los robots beben electricidad. ¿Tú qué?',
      '¿Vives de aire puro? Impresionante. Sigue sin contar.',
      'No detectamos cafeína ni agua. Sospechoso.',
    ],
    successMessage: 'Hidratación verificada. Eres oficialmente mamífero.',
    emoji: '☕',
  },
  {
    id: 'fruit',
    title: 'Prueba evolutiva',
    instruction: 'Los monos pasan el captcha al primer intento. ¿Puedes con una fruta?',
    hint: 'Manzana, plátano, naranja… fruta real, no emoji.',
    failMessages: [
      '¿Eres de los que compran fruta para decorar la encimera?',
      'Eso no es fruta. Es optimismo.',
      'La visión por computador no ve potasio.',
    ],
    successMessage: 'ADN compartido con primates: confirmado.',
    emoji: '🍌',
  },
  {
    id: 'book',
    title: 'Prueba anti-alucinación',
    instruction: 'Los LLM leen internet. Tú, demuestra que lees papel (o tapa dura).',
    hint: 'Abre un libro frente a la cámara.',
    failMessages: [
      '¿Lees en TikTok? No cuenta.',
      'Un bot leería más rápido. Muéstranos algo físico.',
      'Cero páginas detectadas. Biblioteca vacía.',
    ],
    successMessage: 'Lectura analógica detectada. Respeto.',
    emoji: '📚',
  },
  {
    id: 'wave',
    title: 'Prueba de empatía',
    instruction: 'Saluda a la cámara. Los bots son antisociales por diseño.',
    hint: 'Extiende los brazos o saluda con alguien al lado.',
    failMessages: [
      'Demasiado rígido. ¿Eres un maniquí?',
      'Los humanos saludan. Los scripts hacen console.log.',
      'Necesitamos gestos. No una pose de estatua.',
    ],
    successMessage: 'Saludo humano aprobado. Bienvenido, ser social.',
    emoji: '👋',
  },
  {
    id: 'scissors',
    title: 'Prueba de manualidad',
    instruction: 'Corta con tijeras. No con Ctrl+X. Literalmente.',
    hint: 'Sujeta unas tijeras abiertas frente a la cámara.',
    failMessages: [
      '¿Cortas con la mente? Impresionante pero inválido.',
      'Tijeras no detectadas. ¿Modo edición de texto?',
      'Eso parece un tenedor con ambición.',
    ],
    successMessage: 'Manualidad confirmada. Puedes abrir paquetes de galletas.',
    emoji: '✂️',
  },
  {
    id: 'teddy',
    title: 'Prueba del niño interior',
    instruction: 'Muéstranos un peluche. Los algoritmos no tienen infancia.',
    hint: 'Oso, delfín, lo que sobrevivió a tu adolescencia.',
    failMessages: [
      '¿Tu peluche es emocionalmente distante?',
      'Cero ternura detectada en el frame.',
      'Los bots no abrazan. Tú tampoco, al parecer.',
    ],
    successMessage: 'Ternura verificada. Pase usted, alma sensible.',
    emoji: '🧸',
  },
  {
    id: 'dev',
    title: 'Prueba del impostor',
    instruction: '¿Humano O programador? Aparece con tu portátil. (Spoiler: a veces son lo mismo.)',
    hint: 'Cara + laptop en la misma toma.',
    failMessages: [
      'Solo vemos código, no humano. Clásico.',
      '¿Trabajas en la nube literalmente?',
      'Falta la parte biológica del combo.',
    ],
    successMessage: 'Humano-programador híbrido autenticado. Stack: café + bugs.',
    emoji: '💻',
  },
];

export function pickCaptchaRound(count = 2): CaptchaChallenge[] {
  const pool = [...CAPTCHA_CHALLENGES];
  const picked: CaptchaChallenge[] = [];

  while (picked.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

export function scoreCaptchaChallenge(
  id: string,
  detections: Detection[],
  width: number,
  height: number,
): number {
  switch (id) {
    case 'breathe':
      return personScore(detections, width, height, 0.06);
    case 'phone':
      return objectScore(bestOfClass(detections, [PHONE]), width, height);
    case 'drink':
      return objectScore(bestOfClass(detections, [CUP, BOTTLE]), width, height);
    case 'fruit':
      return objectScore(bestOfClass(detections, [BANANA, APPLE, ORANGE]), width, height);
    case 'book':
      return objectScore(bestOfClass(detections, [BOOK]), width, height);
    case 'wave':
      return scoreHandshake(detections, width, height);
    case 'scissors':
      return objectScore(bestOfClass(detections, [SCISSORS]), width, height);
    case 'teddy':
      return objectScore(bestOfClass(detections, [TEDDY]), width, height);
    case 'dev': {
      const person = personScore(detections, width, height, 0.05);
      const laptop = objectScore(bestOfClass(detections, [LAPTOP]), width, height);
      if (person < 0.35 || laptop < 0.35) return Math.min(person, laptop) * 0.6;
      return Math.min(1, (person + laptop) / 2);
    }
    case COMMUNION_WATCH_ID:
      return scoreCommunionWatch(detections, width, height).score;
    case GERONIMO_STILTON_ID:
      return objectScore(bestOfClass(detections, [BOOK], 0.28), width, height, 0.008);
    case CHILDHOOD_TEDDY_ID:
      return objectScore(bestOfClass(detections, [TEDDY], 0.28), width, height, 0.008);
    case NO_INNER_CHILD_ID:
      return scoreNoInnerChild(detections, width, height);
    default:
      return 0;
  }
}

export function passThresholdForChallenge(id: string): number {
  if (id === COMMUNION_WATCH_ID) return 0.45;
  if (id === GERONIMO_STILTON_ID || id === CHILDHOOD_TEDDY_ID) return 0.52;
  if (id === NO_INNER_CHILD_ID) return 0.55;
  return PASS_THRESHOLD;
}

export function scoreCaptchaChallengeDetailed(
  id: string,
  detections: Detection[],
  width: number,
  height: number,
): { score: number; debug?: CommunionWatchDebug } {
  if (id === COMMUNION_WATCH_ID) {
    const result = scoreCommunionWatch(detections, width, height);
    return { score: result.score, debug: result.debug };
  }
  return { score: scoreCaptchaChallenge(id, detections, width, height) };
}

export const PASS_THRESHOLD = 0.62;
export const HOLD_MS = 1400;
