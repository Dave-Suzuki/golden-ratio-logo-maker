import type { GradeResult, Given, Question } from './types';
import { SYMBOL_GLYPHS, formatNumber } from './format';

/** Parse a learner's numeric answer: "-3.67", "3,200", "3/8", "35%", "$12.84", "≈ 0.25". */
export function parseNumeric(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^(≈|~|approx\.?|about|=)\s*/, '');
  s = s.replace(/[$€£]/g, '').replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, '');
  let pct = false;
  if (s.endsWith('%')) {
    pct = true;
    s = s.slice(0, -1);
  }
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  let v: number;
  if (frac) {
    const d = Number(frac[2]);
    if (d === 0) return null;
    v = Number(frac[1]) / d;
  } else {
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/.test(s)) return null;
    v = Number(s);
  }
  if (!Number.isFinite(v)) return null;
  return pct ? v / 100 : v;
}

/** Normalize a typed symbol/word so "≥", ">=", "=>" and " GE " compare equal. */
export function normalizeSymbol(s: string): string {
  let t = s.trim().toLowerCase().replace(/\s+/g, '');
  t = t.replace(/^h_?0:?/, 'h0:').replace(/^h_?[a1]:?/, 'ha:');
  for (const [k, v] of Object.entries(SYMBOL_GLYPHS)) t = t.split(k).join(v);
  t = t.replace(/≥/g, '≥').replace(/≤/g, '≤').replace(/≠/g, '≠');
  return t;
}

export function formatAnswer(q: Question): string {
  switch (q.kind) {
    case 'mc':
      return `${String.fromCharCode(97 + q.correctIndex)}. ${q.options[q.correctIndex] ?? ''}`;
    case 'numeric': {
      const pct = q.unit === '%';
      return pct ? `${formatNumber(q.answer)}%` : formatNumber(q.answer);
    }
    case 'fill':
      return q.blanks.map((b) => `${b.label}: ${b.answer}`).join('; ');
    case 'tf':
      return q.answer ? 'True' : 'False';
    case 'open':
      return q.modelSolution;
  }
}

export function grade(q: Question, given: Given): GradeResult {
  const correctDisplay = formatAnswer(q);
  switch (q.kind) {
    case 'mc':
      return { correct: given.kind === 'mc' && given.index === q.correctIndex, correctDisplay };
    case 'numeric': {
      if (given.kind !== 'numeric') return { correct: false, correctDisplay, parsedValue: null };
      let v = parseNumeric(given.raw);
      if (v === null) return { correct: false, correctDisplay, parsedValue: null };
      // a percent-unit answer is stored as the displayed number (e.g. 35 for 35%)
      if (q.unit === '%' && given.raw.trim().endsWith('%')) v = v * 100;
      const abs = q.tolerance.abs ?? 0;
      const rel = (q.tolerance.rel ?? 0) * Math.abs(q.answer);
      const tol = Math.max(abs, rel, 1e-9);
      return { correct: Math.abs(v - q.answer) <= tol, correctDisplay, parsedValue: v };
    }
    case 'fill': {
      const values = given.kind === 'fill' ? given.values : [];
      const perBlank = q.blanks.map((b, i) => {
        const v = normalizeSymbol(values[i] ?? '');
        const ok = [b.answer, ...(b.accept ?? [])].map(normalizeSymbol);
        return v.length > 0 && ok.includes(v);
      });
      return { correct: perBlank.every(Boolean), correctDisplay, perBlank };
    }
    case 'tf':
      return { correct: given.kind === 'tf' && given.value === q.answer, correctDisplay };
    case 'open': {
      if (given.kind !== 'open' || !given.selfMark) return { correct: null, correctDisplay, needsSelfMark: true };
      return { correct: given.selfMark === 'got', correctDisplay };
    }
  }
}
