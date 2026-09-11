/** Number and symbol formatting shared by the UI, the mistake log and the printed answer key. */

export function formatNumber(v: number, maxDecimals = 4): string {
  if (!Number.isFinite(v)) return String(v);
  const rounded = Math.round(v * 10 ** maxDecimals) / 10 ** maxDecimals;
  return String(rounded);
}

export const SYMBOL_GLYPHS: Record<string, string> = {
  '>=': '≥',
  '=>': '≥',
  '<=': '≤',
  '=<': '≤',
  '!=': '≠',
  '<>': '≠',
  '=/=': '≠',
  mu: 'μ',
  sigma: 'σ',
  phat: 'p̂',
  'p-hat': 'p̂',
  'p^': 'p̂',
  xbar: 'x̄',
  'x-bar': 'x̄',
  'x_bar': 'x̄',
};

export const HYPOTHESIS_SYMBOLS = ['=', '≠', '<', '>', '≤', '≥'] as const;
