// Cliente de navegador para el proxy /api/analyze (visión por IA en el servidor).
// Réplica del RekognitionVerdict de server/analyze-frame.ts (sincronizado a mano).

export type FaceFlag = { value: boolean; confidence: number };
export type Label = { name: string; confidence: number };
export type Roast = { score: number; type: string; redFlags: string[]; findings: string[] };
export type RekognitionVerdict = {
  faceFound: boolean;
  sunglasses?: FaceFlag;
  eyeglasses?: FaceFlag;
  smile?: FaceFlag;
  eyesOpen?: FaceFlag;
  mouthOpen?: FaceFlag;
  beard?: FaceFlag;
  emotion?: { type: string; confidence: number };
  pose?: { yaw: number; pitch: number; roll: number };
  labels?: Label[];
  roast?: Roast;
  error?: string;
};

export async function requestRekognition(
  dataUrl: string,
): Promise<RekognitionVerdict | null> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    const data = (await res.json()) as RekognitionVerdict;
    if (!res.ok) return { faceFound: false, error: data.error ?? `HTTP ${res.status}` };
    return data;
  } catch (err) {
    return { faceFound: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Generación de roasts (parodia — basado solo en lo que la IA "vio" en cuadro)
// ---------------------------------------------------------------------------

const EMOTION_EMOJI: Record<string, string> = {
  HAPPY: '😄',
  SAD: '😢',
  ANGRY: '😠',
  CONFUSED: '🤨',
  DISGUSTED: '🤢',
  SURPRISED: '😲',
  CALM: '😐',
  FEAR: '😨',
  UNKNOWN: '❓',
};

const EMOTION_ES: Record<string, string> = {
  HAPPY: 'FELIZ',
  SAD: 'TRISTE',
  ANGRY: 'CABREAD@',
  CONFUSED: 'CONFUNDID@',
  DISGUSTED: 'ASQUEAD@',
  SURPRISED: 'SORPRENDID@',
  CALM: 'TRANQUIL@',
  FEAR: 'CON MIEDO',
  UNKNOWN: '¿?',
};

function pick(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function yawWord(yaw: number): string {
  if (yaw <= -18) return 'girada (a la derecha)';
  if (yaw >= 18) return 'girada (a la izquierda)';
  return 'de frente';
}

function faceRoast(v: RekognitionVerdict): string {
  if (v.sunglasses?.value) {
    return pick([
      'Gafas de sol en interior. Lo único con sombra aquí eres tú.',
      'Gafas de sol para una webcam — el futuro no es brillante, pero tu delirio sí.',
    ]);
  }
  switch (v.emotion?.type) {
    case 'CALM':
      return pick([
        'La IA te lee como “tranquil@”, que es su forma de decir “muert@ por dentro”.',
        'Sirviendo mirada vacía. Un salvapantallas tiene más vida.',
      ]);
    case 'HAPPY':
      return pick([
        'Sonriendo a una webcam sin que nadie te lo pida. Preocupante. Tierno, pero preocupante.',
        'Esa alegría es sospechosa. ¿Qué escondes, y es tu historial de búsqueda?',
      ]);
    case 'ANGRY':
      return pick([
        'Tienes cara de querer pelear con la cámara. La cámara gana.',
        'Esa cara corta la leche. El outfit no hizo eso — la personalidad sí.',
      ]);
    case 'SAD':
      return pick(['La IA detectó tristeza. Te entiendo, colega. Te entiendo.', 'Esos son ojos de “visto y no contestado”.']);
    case 'SURPRISED':
      return '¿Sorprendid@? Es una cámara. Lleva ahí todo el rato.';
    case 'CONFUSED':
      return 'Cara de confusión detectada. Normal — nadie sabe qué es esta app tampoco.';
    case 'DISGUSTED':
      return 'Tienes cara de asco. Valiente, teniendo en cuenta que la cámara te mira a ti.';
    default:
      break;
  }
  if (v.beard?.value) return 'La barba sostiene la cara entera. Súbele el sueldo y mándale una postal.';
  if (v.smile && !v.smile.value) return 'Ni una sonrisa de cortesía. Brutal. La cámara lo está intentando.';
  return pick([
    'La cara es… una cara. Hemos visto peores. Hace poco. En un espejo.',
    'Una cara perfectamente olvidable. Ni protección de testigos se molestaría.',
  ]);
}

type LabelGroup = { match: readonly string[]; lines: readonly string[] };

const OUTFIT_GROUPS: readonly LabelGroup[] = [
  {
    match: ['suit', 'blazer', 'tuxedo', 'formal wear', 'tie', 'overcoat'],
    lines: [
      '¿Un traje? ¿Para esto? Demasiado arreglad@ para una webcam, poco para la decepción.',
      'Ropa formal para hablarle a un portátil. ¿A quién intentamos impresionar, a RRHH?',
    ],
  },
  {
    match: ['hoodie', 'sweatshirt', 'sweater'],
    lines: [
      'La sudadera dice “he dejado de intentarlo”. Alto y claro, amig@.',
      'Modo gremlin total. Esa sudadera ha visto cosas y lavadora ninguna.',
    ],
  },
  {
    match: ['pajamas', 'robe', 'bathrobe', 'nightwear', 'loungewear'],
    lines: [
      'Pijama en cámara. Atrevido para alguien que busca validación.',
      'Vestid@ para la siesta, actuando para un público. Respetamos el caos.',
    ],
  },
  {
    match: ['dress', 'gown', 'evening dress'],
    lines: ['Arreglad@ sin sitio a donde ir salvo esta app maldita. Trágico e icónico.'],
  },
  {
    match: ['hat', 'cap', 'beanie', 'sun hat'],
    lines: ['El gorro hace mucho trabajo — sobre todo tapar pruebas. Vemos la coartada.'],
  },
  {
    match: ['t-shirt', 'shirt', 'jersey', 'polo'],
    lines: [
      'Una camiseta. Revolucionario. Material puro de Fashion Week.',
      'Esa camiseta es el equivalente visual a decir “ns, elige tú”.',
    ],
  },
];

const SCENE_GROUPS: readonly LabelGroup[] = [
  {
    match: ['bed', 'bedroom', 'pillow', 'blanket', 'mattress'],
    lines: [
      'Haciendo negocios desde la cama. Ambición: horizontal.',
      'Despellejando desde el dormitorio — el hábitat natural del potencial sin terminar.',
    ],
  },
  {
    match: ['kitchen', 'refrigerator', 'oven', 'microwave', 'sink', 'appliance'],
    lines: ['Grabando en la cocina — al menos cuando esto salga mal tienes snacks cerca.'],
  },
  {
    match: ['desk', 'computer', 'laptop', 'monitor', 'screen', 'keyboard', 'office'],
    lines: [
      'Energía de escritorio estéril. Tu personalidad entera es un segundo monitor.',
      'Puesto de batalla en cuadro. Toca hierba — la verde de fuera, no la del RGB.',
    ],
  },
  {
    match: ['couch', 'sofa', 'living room', 'television', 'tv'],
    lines: ['Sofá de fondo detectado. El trono de quien “iba a ser productiv@ hoy”.'],
  },
  {
    match: ['plant', 'potted plant', 'houseplant', 'flower'],
    lines: ['¡Una planta! Prueba de que mantienes algo con vida. Listón bajo, pero superado.'],
  },
  {
    match: ['book', 'bookcase', 'library', 'shelf'],
    lines: ['Libros en cuadro — ¿decoración o leídos? Los dos sabemos la respuesta.'],
  },
  {
    match: ['clutter', 'mess', 'trash', 'garbage'],
    lines: ['El fondo es puro caos. Vemos el trauma sin procesar desde aquí.'],
  },
];

function findGroup(groups: readonly LabelGroup[], names: Set<string>): string | undefined {
  for (const g of groups) {
    if (g.match.some((m) => names.has(m))) return pick(g.lines);
  }
  return undefined;
}

const OUTFIT_HINT = /shirt|jacket|coat|blazer|suit|dress|hoodie|sweater|sleeve|hood|footwear|shoe|sneaker|boot|hat|cap|tie|jeans|pants|trousers|clothing|apparel|costume|scarf|glove|sock/;
const SKIP_LABELS = /^(person|human|face|head|man|woman|adult|male|female|people|portrait|photography|selfie)$/;

function labelFromNames(names: Set<string>, test: RegExp): string | undefined {
  for (const n of names) if (test.test(n)) return n;
  return undefined;
}

function outfitRoast(names: Set<string>): string {
  const g = findGroup(OUTFIT_GROUPS, names);
  if (g) return g;
  const item = labelFromNames(names, OUTFIT_HINT);
  if (item)
    return pick([
      `La IA detectó “${item}” y aun así bostezó. Ni el algoritmo se salva del aburrimiento.`,
      `“${item}” en cuadro. Valiente elección para impresionar a una webcam.`,
    ]);
  return 'Lleves lo que lleves, era tan olvidable que la IA se encogió de hombros y siguió.';
}

function sceneRoast(names: Set<string>): string {
  const g = findGroup(SCENE_GROUPS, names);
  if (g) return g;
  const obj = [...names].find((n) => !SKIP_LABELS.test(n) && !OUTFIT_HINT.test(n));
  if (obj)
    return pick([
      `Detrás tienes “${obj}”. Todo un montaje. Cero misterio, mucho desorden.`,
      `La IA vio “${obj}” de fondo y entendió todo sobre tu vida. No era bonito.`,
    ]);
  return pick([
    'Un fondo más bien vacío — tan vacío como tu calendario este finde.',
    'El escenario grita “no planeaba que me vieran hoy”. Buena decisión, mal resultado.',
  ]);
}

/** Hallazgos estructurados + un roast brutal en tres partes (cara / outfit / fondo). */
export function describeVision(v: RekognitionVerdict): {
  findings: string[];
  roasts: string[];
} {
  const findings: string[] = [];
  const names = new Set((v.labels ?? []).map((l) => l.name.toLowerCase()));

  if (v.faceFound) {
    if (v.sunglasses) {
      findings.push(
        v.sunglasses.value
          ? `😎 Gafas de sol: sí (${v.sunglasses.confidence}%)`
          : '🕶️ Gafas de sol: ninguna',
      );
    }
    if (v.eyeglasses?.value) findings.push(`👓 Gafas (${v.eyeglasses.confidence}%)`);
    if (v.emotion) {
      const e = EMOTION_EMOJI[v.emotion.type] ?? '🙂';
      const word = EMOTION_ES[v.emotion.type] ?? v.emotion.type;
      findings.push(`${e} Ánimo: ${word} (${v.emotion.confidence}%)`);
    }
    if (v.smile) findings.push(v.smile.value ? '🙂 Sonriendo' : '😶 Sin sonreír');
    if (v.beard?.value) findings.push('🧔 Barba detectada');
    if (v.pose) findings.push(`🧭 Cabeza: ${yawWord(v.pose.yaw)}`);
  }
  if (v.labels?.length) {
    const top = v.labels.slice(0, 6).map((l) => l.name).join(', ');
    findings.push(`🔎 Detectado: ${top}`);
  }

  const roasts: string[] = [];
  if (v.faceFound) {
    if (v.emotion) {
      const word = (EMOTION_ES[v.emotion.type] ?? v.emotion.type).toLowerCase();
      roasts.push(`😏 Rekognition te lee ${word} a un ${v.emotion.confidence}%. ${faceRoast(v)}`);
    } else {
      roasts.push(`😏 ${faceRoast(v)}`);
    }
    if (v.sunglasses?.value) {
      roasts.push(
        `🕶️ Gafas de sol al ${v.sunglasses.confidence}%: tapas los ojos con la misma facilidad con la que tapas tus red flags.`,
      );
    }
    if (v.smile && !v.smile.value) {
      roasts.push(
        `😶 Ni media sonrisa (${v.smile.confidence}% de seguridad). La webcam ha puesto más de su parte que tú en cualquier relación.`,
      );
    }
    if (v.pose && Math.abs(v.pose.yaw) >= 15) {
      roasts.push(`🧭 Cara girada ${Math.abs(v.pose.yaw)}°: ni de frente eres capaz de dar la cara.`);
    }
  }
  roasts.push(`👕 ${outfitRoast(names)}`);
  roasts.push(`🖼️ ${sceneRoast(names)}`);

  return { findings, roasts: roasts.slice(0, 5) };
}
