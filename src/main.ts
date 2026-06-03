// ToxiCheck — entry point. Boots the screen router into #app.
import '../guille/src/style.css';
import { bootToxiCheck } from './toxicheck/app';

const root = document.querySelector<HTMLElement>('#app');
if (root) bootToxiCheck(root);
