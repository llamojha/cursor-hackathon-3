import { BoxOverlay, loadModel, type LIBREYOLO } from 'libreyolo-web';
import {
  CAPTCHA_CHOICES,
  COMMUNION_WATCH_ID,
  HOLD_MS,
  NO_INNER_CHILD_ID,
  type CaptchaChallenge,
  passThresholdForChallenge,
  pickChosenChallenge,
  scoreCaptchaChallengeDetailed,
} from './captcha';
import { CameraStream } from './camera';

const BOT_QUIPS = [
  'Analizando si eres humano o un GPT con cámara…',
  'Consultando con 47 neuronas artificiales…',
  'Buscando dedos. Los bots suelen tener 0.',
  '¿Sudas? Los robots no. Aún.',
  'Comparando tu cara con Wikipedia…',
];

export class LandingApp {
  private root: HTMLElement;
  private onRoastMatch: () => void;
  private camera = new CameraStream();
  private model: LIBREYOLO | null = null;
  private detectLoop: number | null = null;
  private rounds: CaptchaChallenge[] = [];
  private roundIndex = 0;
  private holdStart: number | null = null;
  private verified = false;

  constructor(root: HTMLElement, onRoastMatch: () => void) {
    this.root = root;
    this.onRoastMatch = onRoastMatch;
    this.renderHero();
  }

  private stopLoop() {
    if (this.detectLoop) cancelAnimationFrame(this.detectLoop);
    this.detectLoop = null;
    this.holdStart = null;
  }

  private async ensureModel(onProgress: (p: number) => void) {
    if (this.model) return this.model;
    // Self-hosted YOLOX Nano (public/models/, fetched at build time) so the
    // weights load same-origin instead of cross-origin from HuggingFace.
    this.model = await loadModel('/models/yolox_n.onnx', {
      modelFamily: 'yolox',
      inputSize: 416,
      confThres: 0.32,
      device: 'auto',
      onProgress,
    });
    return this.model;
  }

  private renderHero() {
    this.stopLoop();
    this.camera.stop();

    this.root.innerHTML = `
      <div class="landing">
        <header class="landing-header">
          <span class="landing-badge">HumanoVerificado™ v4.20</span>
          <h1>¿Eres humano?</h1>
          <p class="landing-lead">
            reCAPTCHA te pide semáforos. Nosotros te pedimos cosas absurdas
            y usamos <strong>visión artificial</strong> para comprobarlo. Porque la confianza
            se gana con cafeína, peluches y saludos incómodos.
          </p>
        </header>

        <section class="landing-grid">
          <article class="landing-card">
            <span class="landing-card-icon">🤖</span>
            <h2>No somos reCAPTCHA</h2>
            <p>Sin coches, semáforos ni «selecciona todas las imágenes». Solo pruebas que un bot fallaría con dignidad.</p>
          </article>
          <article class="landing-card">
            <span class="landing-card-icon">👁️</span>
            <h2>Visión en el navegador</h2>
            <p>LibreYOLO analiza tu cámara en local. Nada sale de tu dispositivo. Excepto tu dignidad, quizá.</p>
          </article>
          <article class="landing-card">
            <span class="landing-card-icon">🔥</span>
            <h2>Después, a roastear</h2>
            <p>Pasa el captcha y entra a <strong>Roast Match</strong>: perfiles con red flags IA y jurado OpenAI.</p>
          </article>
        </section>

        <div class="landing-captcha-preview card">
          <h2 class="choice-heading">Elige tu prueba de humanidad</h2>
          <p class="choice-lead">Un solo objeto. Una sola vergüenza. Tú decides cuál.</p>
          <div class="captcha-choices" id="captcha-choices">
            ${CAPTCHA_CHOICES.map(
              (c) => `
              <button type="button" class="captcha-choice-btn" data-choice="${c.id}" aria-label="${c.label}: ${c.subtitle}">
                <span class="captcha-choice-emoji" aria-hidden="true">${c.emoji}</span>
                <span class="captcha-choice-text">
                  <span class="captcha-choice-label">${c.label}</span>
                  <span class="captcha-choice-sub">${c.subtitle}</span>
                </span>
              </button>
            `,
            ).join('')}
          </div>
          <p class="landing-note">Necesitas cámara y HTTPS. Una prueba según lo que elijas. ~20 segundos de exposición pública.</p>
        </div>

        <section class="landing-roast-cta card">
          <h2>Roast Match</h2>
          <p>Perfiles con outfit, red flag y toxicidad IA. Haz match, suelta un roast cabrón y gana el teléfono si el jurado OpenAI aprueba.</p>
          <button type="button" class="btn-primary" id="roast-match">Entrar a Roast Match →</button>
        </section>

        <footer class="landing-footer">
          <p>Hecho con LibreYOLO · Sin cookies de rastreo · Con mucho sarcasmo</p>
        </footer>
      </div>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('.captcha-choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.startCaptcha(btn.dataset.choice!));
    });
    this.root.querySelector('#roast-match')?.addEventListener('click', () => this.onRoastMatch());
  }

  private startCaptcha(choiceId: string) {
    this.rounds = pickChosenChallenge(choiceId);
    this.roundIndex = 0;
    this.verified = false;
    this.renderCaptchaStep(true);
  }

  private renderCaptchaStep(loading = false) {
    this.stopLoop();
    const challenge = this.rounds[this.roundIndex];
    const quip = BOT_QUIPS[Math.floor(Math.random() * BOT_QUIPS.length)];

    this.root.innerHTML = `
      <div class="screen landing-captcha-screen">
        <div class="hero">
          <span class="landing-badge">Prueba ${this.roundIndex + 1} de ${this.rounds.length}</span>
          <h1>${challenge.emoji} ${challenge.title}</h1>
          <p>${challenge.instruction}</p>
        </div>

        <div class="card captcha-card">
          <div class="camera-wrap" id="cam-wrap">
            ${loading ? `<div class="loader" id="loader">Descargando cerebro artificial…</div>` : ''}
            <canvas class="overlay-canvas" id="overlay"></canvas>
            ${challenge.id === COMMUNION_WATCH_ID ? '<div class="communion-zone" aria-hidden="true"></div>' : ''}
            ${challenge.id === NO_INNER_CHILD_ID ? '<div class="face-only-zone" aria-hidden="true"></div>' : ''}
            <div class="shake-hint" id="hint">${challenge.hint}</div>
            <div class="hud">
              <div class="progress"><span id="prog"></span></div>
              <span id="hud-text">${quip}</span>
            </div>
          </div>

          <p class="captcha-status" id="status"></p>

          <div class="row">
            <button class="btn-secondary" id="back">← Escapar (cobarde)</button>
            <button class="btn-secondary" id="skip-round" disabled title="Los humanos no hacen trampa">Saltar</button>
          </div>
        </div>

        <div class="notice captcha-disclaimer">
          <strong>Aviso legal ficticio:</strong> al fallar repetidamente, el sistema asumirá que eres un bot
          y te recomendará un curso de mindfulness. O un peluche. O ambos.
        </div>
      </div>
    `;

    this.root.querySelector('#back')!.addEventListener('click', () => this.renderHero());
    this.root.querySelector('#skip-round')!.addEventListener('click', () => {
      const status = this.root.querySelector('#status')!;
      status.textContent = 'Trampa detectada. Eres demasiado humano. Prueba invalidada.';
      status.className = 'captcha-status fail';
    });

    void this.bootCamera(challenge);
  }

  private async bootCamera(challenge: CaptchaChallenge) {
    const wrap = this.root.querySelector('#cam-wrap')!;
    const overlay = this.root.querySelector<HTMLCanvasElement>('#overlay')!;
    const prog = this.root.querySelector<HTMLSpanElement>('#prog')!;
    const hudText = this.root.querySelector('#hud-text')!;
    const status = this.root.querySelector('#status')!;
    const loader = this.root.querySelector('#loader');

    try {
      const video = await this.camera.start('user');
      video.classList.add('mirror');
      wrap.prepend(video);

      const model = await this.ensureModel((p) => {
        if (loader) loader.textContent = `Descargando LibreYOLO… ${Math.round(p * 100)}%`;
        const bar = loader?.querySelector('span');
        if (bar) bar.style.width = `${p * 100}%`;
      });
      loader?.remove();

      const isCommunion = challenge.id === COMMUNION_WATCH_ID;
      const passAt = passThresholdForChallenge(challenge.id);

      const boxOverlay = new BoxOverlay({
        canvas: overlay,
        showLabels: true,
        showConfidence: true,
        lineWidth: 2,
        fontSize: 11,
      });

      let failCooldown = 0;
      const tick = async () => {
        if (this.verified || !video.videoWidth) {
          this.detectLoop = requestAnimationFrame(tick);
          return;
        }

        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        const detections = await model.detect(video, {
          confThres: isCommunion ? 0.22 : 0.32,
        });
        const w = video.videoWidth;
        const h = video.videoHeight;
        const { score, debug } = scoreCaptchaChallengeDetailed(challenge.id, detections, w, h);

        boxOverlay.draw(detections.filter((d) => d.confidence > (isCommunion ? 0.22 : 0.32)), {
          originalWidth: w,
          originalHeight: h,
        });

        prog.style.width = `${Math.min(100, (score / passAt) * 100)}%`;

        if (isCommunion && debug) {
          const hintEl = this.root.querySelector('#hint');
          if (hintEl) hintEl.textContent = debug.hint;
          hudText.textContent = `Cara ${Math.round(debug.person * 100)}% · Reloj/pose ${Math.round(Math.max(debug.watch, debug.pose) * 100)}%`;
        }

        if (score >= passAt) {
          if (!this.holdStart) {
            this.holdStart = performance.now();
            hudText.textContent = '¡Casi! Mantén la pose, humano…';
            status.textContent = '';
            status.className = 'captcha-status';
          } else {
            const held = performance.now() - this.holdStart;
            hudText.textContent = `Verificando… ${Math.round((held / HOLD_MS) * 100)}%`;
            if (held >= HOLD_MS) {
              this.onRoundPassed(challenge);
              return;
            }
          }
        } else {
          this.holdStart = null;
          hudText.textContent = score > 0.25 ? 'Calienta motores… casi lo tienes' : BOT_QUIPS[Math.floor(Math.random() * BOT_QUIPS.length)];
          if (performance.now() > failCooldown && score < 0.15) {
            const msg = challenge.failMessages[Math.floor(Math.random() * challenge.failMessages.length)];
            status.textContent = msg;
            status.className = 'captcha-status fail';
            failCooldown = performance.now() + 2800;
          }
        }

        this.detectLoop = requestAnimationFrame(tick);
      };

      this.detectLoop = requestAnimationFrame(tick);
    } catch (err) {
      status.textContent =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Sin permiso de cámara. Los bots no tienen vergüenza, pero necesitan acceso.'
          : 'No pudimos encender la cámara. Prueba con HTTPS y otro navegador.';
      status.className = 'captcha-status fail';
      loader?.remove();
    }
  }

  private onRoundPassed(challenge: CaptchaChallenge) {
    this.verified = true;
    this.stopLoop();
    this.camera.stop();

    if (this.roundIndex < this.rounds.length - 1) {
      this.root.innerHTML = `
        <div class="screen landing-success-step">
          <div class="card captcha-pass-card flash-ok">
            <span class="pass-emoji">${challenge.emoji}</span>
            <h2>¡Prueba superada!</h2>
            <p>${challenge.successMessage}</p>
            <button class="btn-primary" id="next">Siguiente humillación →</button>
          </div>
        </div>
      `;
      this.root.querySelector('#next')!.addEventListener('click', () => {
        this.roundIndex += 1;
        this.verified = false;
        this.renderCaptchaStep();
      });
      return;
    }

    this.renderFinalSuccess();
  }

  private renderFinalSuccess() {
    this.root.innerHTML = `
      <div class="screen landing-final">
        <div class="card captcha-pass-card captcha-final-card flash-ok">
          <span class="pass-emoji">✅</span>
          <h1>Humano certificado</h1>
          <p class="final-copy">
            LibreYOLO ha hablado: contienes suficiente caos biológico como para pasar.
            Tu certificado digital expira nunca, pero tu dignidad sí.
          </p>
          <div class="cert-badge">
            <span>HUMANO</span>
            <small>ID: ${Math.random().toString(36).slice(2, 10).toUpperCase()}</small>
          </div>
          <button class="btn-success landing-cta" id="enter">Entrar a Roast Match →</button>
          <button class="btn-secondary" id="retry">Repetir captcha (masoquista)</button>
        </div>
      </div>
    `;

    this.root.querySelector('#enter')!.addEventListener('click', () => this.onRoastMatch());
    this.root.querySelector('#retry')!.addEventListener('click', () => this.renderHero());
  }

  destroy() {
    this.stopLoop();
    this.camera.stop();
    this.model?.release();
  }
}
