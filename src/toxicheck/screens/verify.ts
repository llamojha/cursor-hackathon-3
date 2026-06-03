import type { ScreenContext, ScreenInstance } from '../types';
import { LandingApp } from '../../../guille/src/landing';

// Pantalla 1: captcha "HumanoVerificado" de Guille (con sus botones de elección).
// Al superar la verificación → seguimos al flujo de nuestro proyecto (outfit).
export function createVerifyScreen(ctx: ScreenContext): ScreenInstance {
  const el = document.createElement('div');
  let app: LandingApp | null = null;

  return {
    el,
    onEnter() {
      app = new LandingApp(el, () => ctx.navigate('outfit'));
    },
    onLeave() {
      app?.destroy();
      app = null;
    },
  };
}
