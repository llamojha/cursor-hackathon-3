import type { Detection } from 'libreyolo-web';
import { labelFromDetection } from './detection-utils';

// Tunable thresholds for how the person fills / sits in the frame.
const FAR_BELOW = 0.45; // person box height < 45% of frame → too far
const CLOSE_ABOVE = 0.92; // > 92% → extreme close-up
const OFFSET_LIMIT = 0.18; // |center offset| > 18% of width → off-center

export type FramingDistance = 'far' | 'good' | 'close';
export type FramingOffset = 'center' | 'left' | 'right';

export type Framing = {
  /** Largest person box height ÷ frame height. */
  heightRatio: number;
  /** Signed horizontal offset of the box center, as a fraction of width. */
  offsetRatio: number;
  distance: FramingDistance;
  offset: FramingOffset;
};

/** Largest person box above the confidence threshold, or null. */
function largestPerson(
  detections: readonly Detection[],
  threshold: number,
): Detection | null {
  let best: Detection | null = null;
  let bestArea = 0;
  for (const d of detections) {
    if (d.confidence < threshold) continue;
    if (labelFromDetection(d) !== 'person') continue;
    const [x1, y1, x2, y2] = d.bbox;
    const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    if (area > bestArea) {
      bestArea = area;
      best = d;
    }
  }
  return best;
}

/**
 * Crude "pose" read derived purely from the person bounding box — the only
 * body signal libreYOLO exposes. Distance from the box size, centering from
 * its horizontal position. Returns null when no person is in frame.
 */
export function assessFraming(
  detections: readonly Detection[],
  frameW: number,
  frameH: number,
  threshold: number,
): Framing | null {
  if (!frameW || !frameH) return null;
  const person = largestPerson(detections, threshold);
  if (!person) return null;

  const [x1, y1, x2, y2] = person.bbox;
  const heightRatio = Math.max(0, y2 - y1) / frameH;
  const centerX = (x1 + x2) / 2;
  const offsetRatio = (centerX - frameW / 2) / frameW;

  const distance: FramingDistance =
    heightRatio < FAR_BELOW ? 'far' : heightRatio > CLOSE_ABOVE ? 'close' : 'good';
  const offset: FramingOffset =
    offsetRatio < -OFFSET_LIMIT ? 'left' : offsetRatio > OFFSET_LIMIT ? 'right' : 'center';

  return { heightRatio, offsetRatio, distance, offset };
}
