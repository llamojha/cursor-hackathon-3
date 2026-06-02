export function formatReceiptDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${Math.abs(delta)}`;
}
