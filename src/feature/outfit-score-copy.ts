export type OutfitTierId = 'pajamas' | 'casual' | 'puttogether' | 'runway';

export type OutfitTier = {
  id: OutfitTierId;
  label: string;
  min: number;
  max: number;
};

export const OUTFIT_TIERS: readonly OutfitTier[] = [
  { id: 'pajamas', label: 'Recién salido de la cama', min: 0, max: 24 },
  { id: 'casual', label: 'Casual pero correcto', min: 25, max: 49 },
  { id: 'puttogether', label: 'Bien conjuntado', min: 50, max: 74 },
  { id: 'runway', label: 'Listo para la pasarela', min: 75, max: 100 },
];

export const OUTFIT_TIER_EMOJI: Record<OutfitTierId, string> = {
  pajamas: '🛌',
  casual: '👕',
  puttogether: '✨',
  runway: '🔥',
};

export const OUTFIT_TIER_ROASTS: Record<OutfitTierId, readonly string[]> = {
  pajamas: [
    'Cero accesorios. Esto no es un outfit, es un secuestro.',
    'El look dice “me he rendido, y tú deberías hacer lo mismo”.',
    'Detectada: la energía exacta de abrir la puerta al repartidor de comida.',
    'Esto es “me pongo cualquier cosa” usado como amenaza.',
    'No vas mal vestid@, vas pre-vestid@. Sigue intentándolo, campeón.',
  ],
  casual: [
    'Del montón. Agresiva, segura y descaradamente del montón.',
    'El equivalente en ropa a un emoji de hombros encogidos. 🤷',
    'Ni bien, ni mal, ni memorable. Una bandera beige con patas.',
    'Vestid@ para “correr al super rezando para que nadie me vea”.',
    'A un accesorio de tener una personalidad entera. Casi.',
  ],
  puttogether: [
    'Ah, ¡esfuerzo! Alguien quiere que lo miren. Respetamos la osadía.',
    'Esto es energía de “sabía que iba a salir en cámara” y se nota.',
    'Conjuntad@ lo justo para engañar a quien no te conoce. Bravo.',
    'Vistes como si pagaras el alquiler y tuvieras el trauma superado. Mentira, pero mono.',
  ],
  runway: [
    'Vale, top model, el resto vamos en pijama. Lee el ambiente.',
    'Accesorizad@ a tope. Pregunta sincera: ¿esto para quién es?',
    'Esto es “bajo en diez minutos” que tardó dos horas. Se nota.',
    'Sirviendo looks a una webcam en un hackathon. Icónic@. Mal de la cabeza. Icónic@.',
  ],
};

export const OUTFIT_WAITING_ROAST =
  'No podemos despellejar el aire. Ponte en cuadro, cobarde.';

/** Feedback de encuadre (desde la caja de la persona) — gana al roast de tier si va mal. */
export const FRAMING_ROASTS: Record<'far' | 'close' | 'offcenter', string> = {
  far: 'Acércate — no podemos puntuar un outfit que no se ve. Eres una mota.',
  close: 'Eh, cámara-fosa-nasal. Atrás — esto es un análisis de outfit, no una cita con el dermatólogo.',
  offcenter: 'Céntrate. Vas medio recortad@ como una foto de perfil con mala conciencia.',
};

export type OutfitRoast = {
  match: (counts: Readonly<Record<string, number>>) => boolean;
  line: string;
};

export const OUTFIT_CONTEXTUAL_ROASTS: readonly OutfitRoast[] = [
  {
    match: (c) => (c.tie ?? 0) >= 1,
    line: 'Una corbata. En un hackathon. O cierras un trato o le mientes a alguien.',
  },
  {
    match: (c) => (c.handbag ?? 0) >= 1 && (c.umbrella ?? 0) >= 1,
    line: 'Bolso Y paraguas — preparad@ para todo menos para que te miren tan fijo.',
  },
  {
    match: (c) => (c.suitcase ?? 0) >= 1,
    line: '¿Una maleta? Valiente hacer la maleta antes de que la primera cita acabe en desastre.',
  },
  {
    match: (c) => (c.backpack ?? 0) >= 1,
    line: 'Mochila puesta. ¿Nos vamos de aventura o se te olvidó madurar?',
  },
  {
    match: (c) => (c['cell phone'] ?? 0) >= 1,
    line: 'Móvil soldado a la mano. El outfit está bien; el apego es la red flag.',
  },
  {
    match: (c) => (c.person ?? 0) >= 2,
    line: 'Foto de grupo. Estadísticamente, uno de vosotros es la foto del “antes”.',
  },
];

/** Etiquetas por objeto para el recibo "¿Por qué?". */
export const OUTFIT_ITEM_LABELS: Record<string, string> = {
  tie: 'vestid@ para impresionar',
  handbag: 'con accesorios',
  backpack: 'list@ para la aventura',
  umbrella: 'preparad@ para la lluvia',
  suitcase: 'de viaje',
};
