// Perfil(es) ficticio(s) hardcodeados para Roast Match. Las 3 fotos viven en
// public/fotos/ (déjalas ahí); si faltan, cae a una imagen de relleno.

export type RoastProfile = {
  id: string;
  displayName: string;
  age: number;
  photos: string[]; // 3 fotos
  toxicityScore: number;
  toxicityType: string;
  redFlags: string[];
  phone: string;
};

/** Relleno inline (mismo origen, no lo bloquea COEP) si faltan las fotos en /fotos. */
export const PHOTO_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'>" +
      "<rect width='100%' height='100%' fill='#1a1a1a'/>" +
      "<text x='50%' y='50%' fill='#ff2d55' font-family='monospace' font-size='22' " +
      "text-anchor='middle' dominant-baseline='middle'>SIN FOTO</text></svg>",
  );

export const ROAST_PROFILES: RoastProfile[] = [
  {
    id: 'fotos-01',
    displayName: 'El Match',
    age: 28,
    photos: ['/fotos/1.jpg', '/fotos/2.jpg', '/fotos/3.jpg'],
    toxicityScore: 84,
    toxicityType: 'GHOSTEADOR SERIAL',
    redFlags: [
      'Gafas de sol en interior y de noche, por si acaso le ve un cazatalentos.',
      'Bio dice «sin dramas» pero tiene 9 historias destacadas de su ex.',
      'Cadena al cuello más cara que tres meses de su alquiler que presume no pagar.',
      'Sonrisa de catálogo de dentista y mirada de «te dejo en visto a las 3:04».',
      'Postureo de gimnasio en el espejo del baño con la luz perfecta. Casualidad cero.',
    ],
    phone: '+34 600 13 37 42',
  },
];

export function getRoastProfile(id: string): RoastProfile | undefined {
  return ROAST_PROFILES.find((p) => p.id === id);
}
