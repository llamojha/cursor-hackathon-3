import type { Detection } from 'libreyolo-web';
import { COCO_CLASSES } from 'libreyolo-web';

export const DETECTION_CONFIDENCE = 0.35;

function normalizeLabelString(raw: string): string {
  return raw.trim().toLowerCase().replaceAll('_', ' ');
}

export function labelFromDetection(d: Detection): string {
  if (d.label) return normalizeLabelString(d.label);
  if (d.classId >= 0 && d.classId < COCO_CLASSES.length) {
    return COCO_CLASSES[d.classId] as string;
  }
  return '';
}

export function countByClass(
  detections: readonly Detection[],
  threshold: number,
  out: Record<string, number>,
): Record<string, number> {
  for (const key of Object.keys(out)) delete out[key];
  for (const d of detections) {
    if (d.confidence < threshold) continue;
    const label = labelFromDetection(d);
    if (!label) continue;
    out[label] = (out[label] ?? 0) + 1;
  }
  return out;
}

export function getCount(counts: Record<string, number>, label: string): number {
  return counts[label] ?? 0;
}
