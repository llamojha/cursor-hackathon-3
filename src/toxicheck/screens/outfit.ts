import type { ScreenContext, ScreenInstance } from '../types';
import './screens.css';

// Pantalla 2 (nuestro proyecto): outfit check. Cámara + animación de análisis
// (sin cajas de detección), captura y puntúa la toxicidad del frame.
export function createOutfitScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="hero">
      <span class="landing-badge">Paso 02 · Outfit</span>
      <h1>La ropa habla. Nosotros traducimos.</h1>
      <p>Ponte en cuadro. Analizamos tu outfit y tu nivel de toxicidad.</p>
    </div>
    <div class="card">
      <div class="tk-stage">
        <video id="tk-video" playsinline muted></video>
        <div class="tk-scan">
          <div class="tk-scan__line"></div>
          <span class="tk-scan__label">Analizando…</span>
        </div>
      </div>
      <p class="captcha-status" id="tk-status"></p>
    </div>
  `;

  const video = el.querySelector<HTMLVideoElement>('#tk-video')!;
  const status = el.querySelector<HTMLElement>('#tk-status')!;
  let timer: number | null = null;

  async function runCapture() {
    // Freeze the frame so the scan visibly "holds" on the captured shot while the
    // (async) vision analysis runs — otherwise the live video keeps moving and it
    // looks like nothing was captured.
    video.pause();
    el.querySelector('.tk-scan')?.classList.add('hidden');
    status.textContent = 'Congelando el desastre y juzgándote…';
    try {
      ctx.state.analysis = await ctx.engine.capture(video);
      ctx.navigate('score');
    } catch {
      status.textContent = 'No se pudo analizar. Reintenta.';
      el.querySelector('.tk-scan')?.classList.remove('hidden');
      void video.play().catch(() => {});
    }
  }

  return {
    el,
    async onEnter() {
      try {
        await ctx.engine.attachCamera(video);
        let left = 3;
        status.textContent = `Analizando outfit… ${left}s`;
        timer = window.setInterval(() => {
          left -= 1;
          if (left > 0) {
            status.textContent = `Analizando outfit… ${left}s`;
          } else {
            if (timer) clearInterval(timer);
            timer = null;
            void runCapture();
          }
        }, 1000);
      } catch {
        status.textContent = 'Sin cámara. Da permiso y usa HTTPS o localhost.';
      }
    },
    onLeave() {
      if (timer) clearInterval(timer);
      timer = null;
      ctx.engine.stopCamera();
    },
  };
}
