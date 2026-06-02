import type { PublicProfile, RoastValidateResult } from './types/profile';

const API = '/api/roast';

export class RoastMatchApp {
  private root: HTMLElement;
  private onBack: () => void;
  private profiles: PublicProfile[] = [];
  private index = 0;
  private matched: PublicProfile | null = null;

  constructor(root: HTMLElement, onBack: () => void) {
    this.root = root;
    this.onBack = onBack;
    void this.boot();
  }

  private async boot() {
    this.renderLoading();
    try {
      const res = await fetch(`${API}/profiles`);
      if (!res.ok) throw new Error('No se pudieron cargar perfiles');
      const data = (await res.json()) as { profiles: PublicProfile[] };
      this.profiles = data.profiles;
      if (this.profiles.length === 0) throw new Error('Sin perfiles');
      this.renderDeck();
    } catch (err) {
      this.renderError(err instanceof Error ? err.message : 'Error de red');
    }
  }

  private renderLoading() {
    this.root.innerHTML = `
      <div class="screen roast-screen">
        <div class="hero">
          <span class="landing-badge">Roast Match</span>
          <h1>Cargando víctimas…</h1>
        </div>
        <div class="loader">Buscando red flags dignas de roast</div>
      </div>
    `;
  }

  private renderError(msg: string) {
    this.root.innerHTML = `
      <div class="screen roast-screen">
        <div class="card">
          <h2>Ups</h2>
          <p class="captcha-status fail">${msg}</p>
          <p class="landing-note">¿Arrancaste el servidor con <code>npm run dev</code> y tienes OPENAI_API_KEY en .env?</p>
          <button class="btn-secondary" id="back">← Volver</button>
        </div>
      </div>
    `;
    this.root.querySelector('#back')?.addEventListener('click', () => this.onBack());
  }

  private current(): PublicProfile | undefined {
    return this.profiles[this.index];
  }

  private renderDeck() {
    const p = this.current();
    if (!p) {
      this.renderEmpty();
      return;
    }

    const toxicClass =
      p.toxicityScore >= 80 ? 'toxic-high' : p.toxicityScore >= 60 ? 'toxic-mid' : 'toxic-low';

    this.root.innerHTML = `
      <div class="screen roast-screen">
        <header class="roast-top">
          <button class="btn-ghost" id="back" type="button">←</button>
          <span class="landing-badge">Roast Match</span>
          <span class="roast-counter">${this.index + 1} / ${this.profiles.length}</span>
        </header>

        <article class="profile-card card">
          <div class="profile-photos">
            <figure class="profile-photo outfit">
              <img src="${p.outfitPhotoUrl}" alt="Outfit de ${p.displayName}" loading="lazy" />
              <figcaption>Outfit</figcaption>
            </figure>
            <figure class="profile-photo redflag">
              <img src="${p.redFlagPhotoUrl}" alt="Red flag de ${p.displayName}" loading="lazy" />
              <figcaption>Red flag</figcaption>
            </figure>
          </div>
          <div class="profile-meta">
            <h1>${p.displayName}, ${p.age}</h1>
            <div class="toxicity-pill ${toxicClass}" title="Toxicidad detectada por IA">
              ☣️ Toxicidad ${p.toxicityScore}%
            </div>
          </div>
        </article>

        <div class="row roast-actions">
          <button class="btn-secondary" id="skip" type="button">Pasapalabra</button>
          <button class="btn-primary" id="match" type="button">Match → Roast</button>
        </div>
      </div>
    `;

    this.root.querySelector('#back')?.addEventListener('click', () => this.onBack());
    this.root.querySelector('#skip')?.addEventListener('click', () => {
      this.index += 1;
      this.renderDeck();
    });
    this.root.querySelector('#match')?.addEventListener('click', () => {
      this.matched = p;
      this.renderRoastForm(p);
    });
  }

  private renderEmpty() {
    this.root.innerHTML = `
      <div class="screen roast-screen">
        <div class="card captcha-pass-card">
          <h2>Te los has cargado a todos</h2>
          <p>Vuelve más tarde o pide más perfiles al generador.</p>
          <button class="btn-primary" id="back">← Inicio</button>
        </div>
      </div>
    `;
    this.root.querySelector('#back')?.addEventListener('click', () => this.onBack());
  }

  private renderRoastForm(p: PublicProfile) {
    const flagsHtml = p.redFlags.map((f) => `<li>${escapeHtml(f)}</li>`).join('');

    this.root.innerHTML = `
      <div class="screen roast-screen">
        <header class="roast-top">
          <button class="btn-ghost" id="back-deck" type="button">←</button>
          <span class="landing-badge">Fase roast</span>
        </header>

        <div class="hero">
          <h1>Destroza a ${escapeHtml(p.displayName)}</h1>
          <p>La IA ya detectó estas red flags. Menciónalas con suficiente mala leche para ganar el número.</p>
        </div>

        <div class="card roast-brief">
          <div class="toxicity-pill toxic-mid">☣️ Toxicidad ${p.toxicityScore}% — cuanto más alta, más cabrón tienes que ser</div>
          <h3>Red flags (texto IA)</h3>
          <ul class="redflag-list">${flagsHtml}</ul>
        </div>

        <div class="card">
          <label for="roast-text">Tu roast</label>
          <textarea id="roast-text" rows="6" maxlength="1200" placeholder="Sin piedad. Que duela. Que se note que leíste las red flags…"></textarea>
          <p class="landing-note" id="char-count">0 / 1200 · mínimo ~24 caracteres</p>
          <button class="btn-primary" id="submit-roast" type="button">Enviar al jurado IA</button>
        </div>
      </div>
    `;

    const ta = this.root.querySelector<HTMLTextAreaElement>('#roast-text')!;
    const count = this.root.querySelector('#char-count')!;
    ta.addEventListener('input', () => {
      count.textContent = `${ta.value.length} / 1200 · mínimo ~24 caracteres`;
    });

    this.root.querySelector('#back-deck')?.addEventListener('click', () => this.renderDeck());
    this.root.querySelector('#submit-roast')?.addEventListener('click', () => void this.submitRoast(p, ta.value));
  }

  private async submitRoast(p: PublicProfile, roast: string) {
    const btn = this.root.querySelector<HTMLButtonElement>('#submit-roast');
    const status = document.createElement('p');
    status.className = 'captcha-status';
    btn?.insertAdjacentElement('afterend', status);

    if (btn) btn.disabled = true;
    status.textContent = 'El jurado está oliendo tu veneno…';

    try {
      const res = await fetch(`${API}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: p.id, roast }),
      });
      const data = (await res.json()) as RoastValidateResult;
      if (!res.ok && data.error) {
        status.textContent = data.error;
        status.className = 'captcha-status fail';
        if (btn) btn.disabled = false;
        return;
      }
      this.renderVerdict(p, data);
    } catch {
      status.textContent = 'Error de red al validar.';
      status.className = 'captcha-status fail';
      if (btn) btn.disabled = false;
    }
  }

  private renderVerdict(p: PublicProfile, data: RoastValidateResult) {
    const passed = Boolean(data.passed);
    const hits = (data.redFlagsHit ?? []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');

    this.root.innerHTML = `
      <div class="screen roast-screen">
        <div class="card ${passed ? 'captcha-pass-card flash-ok' : 'flash-fail'}">
          <span class="pass-emoji">${passed ? '💘' : '💀'}</span>
          <h1>${passed ? '¡Match por roast!' : 'Roast rechazado'}</h1>
          <p>${escapeHtml(data.feedback || '')}</p>

          <div class="roast-scores">
            <div><strong>Brutalidad</strong> ${data.brutalityScore?.toFixed(1) ?? '—'} / 10
              <small>(mín. ${data.requiredBrutality?.toFixed(1) ?? '—'})</small></div>
            <div><strong>Red flags clavadas</strong> ${data.redFlagsHit?.length ?? 0}
              <small>(mín. ${data.requiredRedFlagHits ?? '—'})</small></div>
          </div>

          ${hits ? `<ul class="redflag-list hits">${hits}</ul>` : ''}

          ${
            passed && data.phone
              ? `
            <div class="phone-reveal">
              <span>Teléfono de ${escapeHtml(data.matchedName || p.displayName)}</span>
              <a href="tel:${data.phone.replace(/\s/g, '')}">${escapeHtml(data.phone)}</a>
            </div>
          `
              : `<p class="landing-note">${escapeHtml(data.reason || 'Más mordida y apunta a las red flags.')}</p>`
          }

          <div class="row" style="margin-top:1rem">
            <button class="btn-secondary" id="retry">${passed ? 'Otro perfil' : 'Reintentar roast'}</button>
            <button class="btn-primary" id="home">Inicio</button>
          </div>
        </div>
      </div>
    `;

    this.root.querySelector('#retry')?.addEventListener('click', () => {
      if (passed) {
        this.index += 1;
        this.matched = null;
        this.renderDeck();
      } else {
        this.renderRoastForm(p);
      }
    });
    this.root.querySelector('#home')?.addEventListener('click', () => this.onBack());
  }

  destroy() {
    this.root.innerHTML = '';
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
