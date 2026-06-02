/** Snapshot video + optional detection overlay into a JPEG data URL. */
export function captureStage(
  video: HTMLVideoElement,
  overlay: HTMLCanvasElement | null,
): string {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return '';

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(video, 0, 0, w, h);
  if (overlay && overlay.width > 0 && overlay.height > 0) {
    ctx.drawImage(overlay, 0, 0, w, h);
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}
