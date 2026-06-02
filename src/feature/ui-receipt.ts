import type { MinigamePanel } from './minigames';
import { formatReceiptDelta } from './format';

export function renderReceiptInto(
  panel: MinigamePanel,
  elements: {
    wrap: HTMLElement;
    list: HTMLUListElement;
    footer: HTMLElement;
  },
) {
  const lines = panel.receipt;
  if (!lines?.length) {
    elements.wrap.hidden = true;
    elements.list.replaceChildren();
    elements.footer.textContent = '';
    return;
  }

  elements.wrap.hidden = false;
  elements.list.replaceChildren(
    ...lines.map((line) => {
      const li = document.createElement('li');
      if (line.header) {
        li.className = 'toxic-receipt__line toxic-receipt__line--header';
        li.textContent = line.label;
        return li;
      }
      const tone =
        line.tone ?? (line.delta > 0 ? 'bad' : line.delta < 0 ? 'good' : 'neutral');
      li.className = `toxic-receipt__line toxic-receipt__line--${tone}`;
      li.textContent = `${formatReceiptDelta(line.delta)} ${line.label}`;
      return li;
    }),
  );
  elements.footer.textContent = panel.receiptFooter ?? '';
}
