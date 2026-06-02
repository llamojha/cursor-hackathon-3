import { LandingApp } from './landing';
import { RoastMatchApp } from './roast-match';
import './style.css';

const appRoot = document.querySelector<HTMLElement>('#app');
if (!appRoot) throw new Error('No se encontró #app');

function showLanding() {
  landing = new LandingApp(appRoot, startRoast);
}

function startRoast() {
  landing?.destroy();
  landing = null;
  new RoastMatchApp(appRoot, showLanding);
}

let landing: LandingApp | null = null;
showLanding();
