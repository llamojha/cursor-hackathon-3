import type { ScreenContext, ScreenInstance } from '../types';

export function createSplashScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('section');
  el.className = 'tc-screen';
  el.innerHTML = `<h1 class="tc-display" style="font-size:3rem">TOXI<span class="tc-red">CHECK</span></h1>
    <p class="tc-muted">placeholder</p>`;
  const btn = document.createElement('button');
  btn.className = 'tc-btn';
  btn.textContent = 'Entrar en el caos';
  btn.onclick = () => ctx.navigate('verify');
  el.append(btn);
  return { el };
}
