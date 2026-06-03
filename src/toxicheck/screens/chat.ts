import type { ScreenContext, ScreenInstance } from '../types';

export function createChatScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('section');
  el.className = 'tc-screen';
  el.innerHTML = `<p class="tc-eyebrow">chat desbloqueado</p>
    <p class="tc-muted">placeholder</p>`;
  const btn = document.createElement('button');
  btn.className = 'tc-btn tc-btn--ghost';
  btn.textContent = 'Volver al inicio';
  btn.onclick = () => ctx.navigate('splash');
  el.append(btn);
  return { el };
}
