import type { MarkPaths } from '../render/types';
import { optimizeMark } from './optimize';

export interface EmitOptions {
  /** mark color; default near-black ink */
  color?: string;
  /** background fill; omit for transparent */
  background?: string;
  /** rendered width/height attribute */
  size?: number;
  /**
   * fit the viewBox to the mark's bounds (square, centered, with proportional
   * padding) instead of the full construction canvas. Paths are untouched, so
   * the construction overlay stays registered when rendered on the full canvas.
   */
  fit?: boolean;
}

export type Variant = 'color' | 'mono' | 'inverted';

/** Serialize a rendered mark to a standalone SVG document. */
export function emitSvg(mark: MarkPaths, opts: EmitOptions = {}): string {
  const { color = '#1c1a17', background, size = 1000, fit = false } = opts;
  const optimized = optimizeMark(mark);
  const vb = fit ? fitViewBox(mark.bounds) : { x: 0, y: 0, w: 1000, h: 1000 };
  const body = optimized.paths
    .map((p) =>
      p.role === 'fill'
        ? `<path d="${p.d}" fill="${color}" fill-rule="nonzero"/>`
        : `<path d="${p.d}" fill="none" stroke="${color}" stroke-width="${round3(p.strokeWidth ?? 20)}" stroke-linecap="round"/>`,
    )
    .join('\n  ');
  const bg = background
    ? `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${background}"/>\n  `
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${size}" height="${size}">\n  ${bg}${body}\n</svg>`;
}

/** Square viewBox centered on the mark with φ⁻⁴-proportional padding. */
export function fitViewBox(bounds: MarkPaths['bounds']): { x: number; y: number; w: number; h: number } {
  const side = Math.max(bounds.w, bounds.h);
  const pad = side * 0.1459; // φ⁻⁴ — even the margins sit on the series
  const s = side + 2 * pad;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  return { x: round3(cx - s / 2), y: round3(cy - s / 2), w: round3(s), h: round3(s) };
}

export function emitVariant(mark: MarkPaths, variant: Variant, brandColor = '#1c1a17'): string {
  switch (variant) {
    case 'color':
      return emitSvg(mark, { color: brandColor });
    case 'mono':
      return emitSvg(mark, { color: '#000000' });
    case 'inverted':
      return emitSvg(mark, { color: '#ffffff', background: '#111111' });
  }
}

function round3(n: number): number {
  return Number(n.toFixed(3));
}
