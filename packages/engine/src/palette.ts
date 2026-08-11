import type { BrandBrief } from './schema/brief';
import { makeRng } from './generate/prng';

export interface Palette {
  /** primary brand color, WCAG ≥ 4.5 against paper */
  base: string;
  /** golden-angle accents, in rotation order */
  accents: string[];
  ink: string;
  paper: string;
  /** contrast ratios actually achieved, for display */
  pairs: { fg: string; bg: string; ratio: number }[];
}

export const GOLDEN_ANGLE = 137.5;

/**
 * Palette via golden-angle hue rotation (GEN-6): base hue from the brief's
 * temperature (with seeded, discrete jitter), accents at +137.5° steps,
 * lightness auto-adjusted until every pair passes WCAG 4.5:1. Dependency-free.
 */
export function generatePalette(brief: BrandBrief, seed: number): Palette {
  const rng = makeRng(seed ^ 0x9e3779b9);
  const baseHueByTemp = { warm: 25, cool: 215, neutral: 160 } as const;
  const jitter = (rng.int(5) - 2) * 4; // −8 … +8 in 4° steps: discrete → reproducible
  const hue = (baseHueByTemp[brief.palette_intent.temperature] + jitter + 360) % 360;

  const highContrast = brief.palette_intent.contrast === 'high';
  const sat = highContrast ? 0.72 : 0.55;

  const ink = '#1c1a17';
  const paper = '#faf8f4';

  const base = ensureContrast(hue, sat, highContrast ? 0.34 : 0.42, paper, 4.5);
  const accents = [1, 2, 3].map((i) => {
    const h = (hue + GOLDEN_ANGLE * i) % 360;
    const l = [0.5, 0.66, 0.38][i - 1]!;
    return hslToHex(h, sat * 0.85, l);
  });

  return {
    base,
    accents,
    ink,
    paper,
    pairs: [
      { fg: ink, bg: paper, ratio: round2(contrastRatio(ink, paper)) },
      { fg: base, bg: paper, ratio: round2(contrastRatio(base, paper)) },
      { fg: paper, bg: base, ratio: round2(contrastRatio(paper, base)) },
    ],
  };
}

/** Darken (in L steps) until the color clears the target contrast on bg. */
function ensureContrast(h: number, s: number, l: number, bg: string, target: number): string {
  let lightness = l;
  let hex = hslToHex(h, s, lightness);
  let guard = 0;
  while (contrastRatio(hex, bg) < target && lightness > 0.05 && guard < 40) {
    lightness -= 0.02;
    hex = hslToHex(h, s, lightness);
    guard++;
  }
  return hex;
}

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  const toHexByte = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v + m)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHexByte(rgb[0])}${toHexByte(rgb[1])}${toHexByte(rgb[2])}`;
}

export function relativeLuminance(hex: string): number {
  const chan = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(1) + 0.0722 * chan(2);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
