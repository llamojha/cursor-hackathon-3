import type { ScreenContext, ScreenInstance } from '../types';
import { ROAST_PROFILES, PHOTO_FALLBACK, type RoastProfile } from '../roast/profiles';
import { validateRoast, type RoastVerdict } from '../roast/validator';
import './screens.css';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Pantalla 4: Roast Match con perfil ficticio hardcodeado + validación local.
export function createMatchesScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('div');
  el.className = 'screen roast-screen';
  const profile = ROAST_PROFILES[0]!;

  function fallbackImgs() {
    el.querySelectorAll<HTMLImageElement>('.tk-photos img').forEach((img) => {
      img.addEventListener('error', () => {
        img.src = PHOTO_FALLBACK;
      });
    });
  }

  function renderProfile() {
    const toxicClass =
      profile.toxicityScore >= 80 ? 'toxic-high' : profile.toxicityScore >= 60 ? 'toxic-mid' : 'toxic-low';
    const photos = profile.photos
      .map((src, i) => `<img src="${src}" alt="Foto ${i + 1} de ${esc(profile.displayName)}" />`)
      .join('');

    el.innerHTML = `
      <header class="roast-top">
        <span class="landing-badge">Paso 04 · Roast Match</span>
      </header>
      <article class="profile-card card">
        <div class="tk-photos">${photos}</div>
        <div class="profile-meta">
          <h1>${esc(profile.displayName)}, ${profile.age}</h1>
          <div class="toxicity-pill ${toxicClass}">☣️ Toxicidad ${profile.toxicityScore}% · ${esc(profile.toxicityType)}</div>
        </div>
      </article>
      <div class="card">
        <p>Compatibilidad por nivel de daño. Para desbloquear su número, tienes que roastearle bien. La IA ya detectó sus red flags.</p>
      </div>
      <button class="btn-primary" id="to-roast">Match → Roastear</button>
    `;
    fallbackImgs();
    el.querySelector('#to-roast')!.addEventListener('click', renderRoastForm);
  }

  function renderRoastForm() {
    const flags = profile.redFlags.map((f) => `<li>${esc(f)}</li>`).join('');
    el.innerHTML = `
      <header class="roast-top">
        <button class="btn-ghost" id="back" type="button">←</button>
        <span class="landing-badge">Fase roast</span>
      </header>
      <div class="hero">
        <h1>Destroza a ${esc(profile.displayName)}</h1>
        <p>La ropa habla, nosotros traducimos. Menciona sus red flags con suficiente mala leche para ganar el número.</p>
      </div>
      <div class="card">
        <div class="toxicity-pill toxic-mid">☣️ Toxicidad ${profile.toxicityScore}% — cuanto más alta, más cabrón hay que ser</div>
        <h3>Red flags (detectadas por IA)</h3>
        <ul class="redflag-list">${flags}</ul>
      </div>
      <div class="card">
        <label for="roast-text">Tu roast</label>
        <textarea id="roast-text" class="tk-roast-textarea" rows="6" maxlength="1200" placeholder="Sin piedad. Que duela. Que se note que leíste las red flags…"></textarea>
        <p class="landing-note" id="char-count">0 / 1200 · mínimo ~24 caracteres</p>
        <button class="btn-primary" id="submit-roast" type="button">Enviar al jurado</button>
      </div>
    `;
    const ta = el.querySelector<HTMLTextAreaElement>('#roast-text')!;
    const count = el.querySelector<HTMLElement>('#char-count')!;
    ta.addEventListener('input', () => {
      count.textContent = `${ta.value.length} / 1200 · mínimo ~24 caracteres`;
    });
    el.querySelector('#back')!.addEventListener('click', renderProfile);
    el.querySelector('#submit-roast')!.addEventListener('click', () => {
      const verdict = validateRoast(profile, ta.value);
      renderVerdict(verdict);
    });
  }

  function renderVerdict(v: RoastVerdict) {
    const hits = v.redFlagsHit.map((f) => `<li>${esc(f)}</li>`).join('');
    el.innerHTML = `
      <div class="card ${v.passed ? 'captcha-pass-card flash-ok' : 'flash-fail'}">
        <span class="pass-emoji">${v.passed ? '💘' : '💀'}</span>
        <h1>${v.passed ? '¡Match por roast!' : 'Roast rechazado'}</h1>
        <p>${esc(v.feedback)}</p>
        <div class="tk-scores">
          <div><strong>Brutalidad</strong> ${v.brutalityScore.toFixed(1)} / 10
            <small>(mín. ${v.requiredBrutality.toFixed(1)})</small></div>
          <div><strong>Red flags clavadas</strong> ${v.redFlagsHit.length}
            <small>(mín. ${v.requiredRedFlagHits})</small></div>
        </div>
        ${hits ? `<ul class="redflag-list hits">${hits}</ul>` : ''}
        ${
          v.passed && v.phone
            ? `<div class="phone-reveal"><span>Teléfono de ${esc(v.matchedName ?? profile.displayName)}</span>
                 <a href="tel:${v.phone.replace(/\s/g, '')}">${esc(v.phone)}</a></div>`
            : `<p class="landing-note">Más veneno y apunta a las red flags.</p>`
        }
        <div class="row" style="margin-top:1rem">
          <button class="btn-secondary" id="retry">${v.passed ? 'Otro intento' : 'Reintentar roast'}</button>
          <button class="btn-primary" id="home">Volver al captcha</button>
        </div>
      </div>
    `;
    el.querySelector('#retry')!.addEventListener('click', renderRoastForm);
    el.querySelector('#home')!.addEventListener('click', () => ctx.navigate('verify'));
  }

  return {
    el,
    onEnter() {
      renderProfile();
    },
  };
}

// Mantener el tipo importado por compatibilidad de firma.
export type { RoastProfile };
