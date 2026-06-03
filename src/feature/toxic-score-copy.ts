export type ToxicTierId = 'green' | 'beige' | 'yellow' | 'toxic';

export type ToxicTier = {
  id: ToxicTierId;
  label: string;
  min: number;
  max: number;
};

export const TOXIC_TIERS: readonly ToxicTier[] = [
  { id: 'green', label: 'Green flag certificada', min: 0, max: 24 },
  { id: 'beige', label: 'Bandera beige — procede con snacks', min: 25, max: 49 },
  { id: 'yellow', label: 'Fábrica de banderas amarillas', min: 50, max: 74 },
  { id: 'toxic', label: 'Peligro tóxico', min: 75, max: 100 },
];

export const TIER_EMOJI: Record<ToxicTierId, string> = {
  green: '✅',
  beige: '🫤',
  yellow: '🚩',
  toxic: '☠️',
};

export const TIER_ROASTS: Record<ToxicTierId, readonly string[]> = {
  green: [
    'Objetivamente poco caos. ¿Aburrid@? Puede. ¿Segur@? Presuntamente.',
    'Sin objetos red flag importantes. El listón estaba en el suelo y lo superaste.',
  ],
  beige: [
    'Algunos objetos sospechosos. No eres malvad@, solo… crónicamente en línea.',
    'Potencial de ick leve. Como darle like a tu propia historia.',
  ],
  yellow: [
    'Varias señales de alarma. Tu situationship está tomando notas.',
    'La cámara está preocupada. Nosotros también, con cariño.',
  ],
  toxic: [
    'Objetos red flag a tope. Este plano necesita aviso de contenido.',
    'Toxicidad al máximo. Haz la búsqueda de objetos al revés — esconde todo.',
  ],
};

export const POINT_CAMERA_ROAST =
  'Apunta la cámara — necesitamos pruebas antes del veredicto tóxico.';

export type ContextualRoast = {
  match: (counts: Readonly<Record<string, number>>) => boolean;
  line: string;
};

export const CONTEXTUAL_ROASTS: readonly ContextualRoast[] = [
  {
    match: (c) => (c['cell phone'] ?? 0) >= 1 && (c.laptop ?? 0) >= 1,
    line: 'Móvil Y portátil — sales con dispositivos, no con personas.',
  },
  {
    match: (c) => (c['cell phone'] ?? 0) >= 2,
    line: 'Dos móviles. ¿Haces malabares con varias historias o montas una estafa?',
  },
  {
    match: (c) => (c.person ?? 0) >= 2,
    line: 'Varios humanos detectados. Predicción tóxica: problemas de compromiso (es broma).',
  },
  {
    match: (c) => (c.person ?? 0) === 0 && (c['cell phone'] ?? 0) >= 1,
    line: 'Móvil sin cara — escribiendo desde el vacío. Clásico.',
  },
  {
    match: (c) => (c.person ?? 0) === 1 && (c['cell phone'] ?? 0) >= 1,
    line: 'Tú más el móvil: protagonista del universo “visto y no contesto”.',
  },
  {
    match: (c) => (c.laptop ?? 0) >= 1 && (c.person ?? 0) <= 1,
    line: 'Energía de portátil de trabajo. Tu rasgo tóxico es “un correo más”.',
  },
];

export const RED_FLAG_LABELS: Record<string, string> = {
  'cell phone': 'adicto al móvil',
  laptop: 'crónicamente con trabajo',
  person: 'demasiados humanos',
  bottle: 'noche desastrosa',
  'wine glass': 'copas dramáticas',
  tv: 'pudrirse en el sofá',
  couch: 'esfuerzo mínimo',
};
