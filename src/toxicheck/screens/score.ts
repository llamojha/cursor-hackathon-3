import type { ScreenContext, ScreenInstance } from '../types';
import './screens.css';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Pantalla 3 (nuestro proyecto): resultado del red flag score.
export function createScoreScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('div');
  el.className = 'screen';
  const a = ctx.state.analysis;

  if (!a) {
    el.innerHTML = `
      <div class="card">
        <h2>Sin análisis</h2>
        <p>No hemos podido leerte. Vuelve al outfit check.</p>
        <button class="btn-primary" id="back">← Volver</button>
      </div>`;
    el.querySelector('#back')!.addEventListener('click', () => ctx.navigate('outfit'));
    return { el };
  }

  const flags = a.redFlags.map((f) => `<li>${esc(f)}</li>`).join('');
  const vision = a.visionLines.length
    ? `<p class="tk-vision">${a.visionLines.map(esc).join(' · ')}</p>`
    : '';

  el.innerHTML = `
    <div class="hero">
      <span class="landing-badge">Paso 03 · Red Flag Score</span>
      <h1>${esc(a.toxicityType)}</h1>
    </div>
    <div class="card tk-score">
      <div class="tk-score__num">${a.toxicityScore}<small>%</small></div>
      <div class="tk-bar"><span style="width:${a.toxicityScore}%"></span></div>
      <p>Compatibilidad por nivel de daño. Cuanto más alto, más leyenda (mala).</p>
    </div>
    <div class="card">
      <h3>Red flags detectadas</h3>
      <ul class="redflag-list">${flags}</ul>
      ${vision}
    </div>
    <button class="btn-primary" id="go">Ver con quién encajas →</button>
  `;

  el.querySelector('#go')!.addEventListener('click', () => ctx.navigate('matches'));
  return { el };
}
