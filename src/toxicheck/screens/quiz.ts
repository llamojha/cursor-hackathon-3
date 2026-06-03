import type { ScreenContext, ScreenInstance } from '../types';

export function createQuizScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('section');
  el.className = 'tc-screen';
  el.innerHTML = `<p class="tc-eyebrow">reto: detector de red flags</p>
    <p class="tc-muted">placeholder</p>`;
  const btn = document.createElement('button');
  btn.className = 'tc-btn';
  btn.textContent = 'Abrir chat';
  btn.onclick = () => ctx.navigate('chat');
  el.append(btn);
  return { el };
}
