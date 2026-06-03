// Veredicto combinado — enfrenta la nota de outfit contra la de toxicidad.
const HOT_TOXIC = [
  'Vas hecho un bombón pero te comportas como una red flag. Desastre icónico.',
  'El outfit dice “sal conmigo”, los objetos dicen “corre”. Ambos tienen razón.',
  'Envoltorio precioso, contenido maldito. Una estafa, pero bien vestida.',
];

const HOT_SAFE = [
  '¿Guap@ Y sin drama? Sospechoso. Vamos a llamar a tu ex para confirmarlo.',
  'Buen outfit, vibras limpias. ¿Eres una planta con forma de persona? Sé sincer@.',
  'Bien conjuntad@ e inofensiv@. Estadísticamente, no existes.',
];

const MID_TOXIC = [
  '¿Mal outfit Y tóxic@? Por lo menos eres coherente en todos los frentes.',
  'Malas vibras por dentro y por fuera. Eficiente, la verdad.',
  'Sin estilo y con bandera roja. El pack completo del anti-glow-up.',
];

const MID_SAFE = [
  'Aburrid@ pero inofensiv@: el equivalente humano a las gachas sin sal.',
  'Sin drama, sin outfit, sin comentarios. Una bandera beige en bermudas.',
  'Inofensiv@ en todos los aspectos. Me sobrevivirías, pero a duras penas me entretienes.',
];

const WAITING = 'Ponte entero en cuadro para que podamos juzgar el desastre completo.';

function rotate(pool: readonly string[], now: number): string {
  return pool[Math.floor(now / 8000) % pool.length]!;
}

/** Elige un veredicto combinado según las dos notas (≥50 = "guapo" / "tóxico"). */
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
