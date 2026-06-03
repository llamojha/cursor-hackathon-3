import type { Detection } from 'libreyolo-web';

const PERSON = 0;

/**
 * "Saludo / brazos abiertos": persona centrada con bbox ancho (brazos fuera)
 * o muy cerca. COCO no tiene manos, así que aproximamos con la caja de persona.
 */
export function scoreHandshake(
  detections: Detection[],
  width: number,
  height: number,
): number {
  const people = detections.filter((d) => d.classId === PERSON && d.confidence >= 0.35);
  if (!people.length) return 0;

  const main = people.sort(
    (a, b) =>
      (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) -
      (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]),
  )[0];

  const w = main.bbox[2] - main.bbox[0];
  const h = main.bbox[3] - main.bbox[1];
  const area = (w * h) / (width * height);
  if (area < 0.05) return main.confidence * 0.3;

  const aspect = w / Math.max(h, 1);
  const armsOut = aspect > 0.6; // hombros/brazos abiertos ensanchan la caja
  const factor = armsOut ? 1.15 : 0.6;
  return Math.min(1, main.confidence * factor * Math.min(1.3, area * 4));
}
