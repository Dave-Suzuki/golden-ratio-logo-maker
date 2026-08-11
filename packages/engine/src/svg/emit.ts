import type { MarkPaths } from '../render/types';
import { optimizeMark } from './optimize';

export interface EmitOptions {
  /** mark color; default near-black ink */
  color?: string;
  /** background fill; omit for transparent */
  background?: string;
  /** override the stroke weight scale (defaults to plan weights) */
  size?: number;
}

export type Variant = 'color' | 'mono' | 'inverted';

/** Serialize a rendered mark to a standalone SVG document. */
export function emitSvg(mark: MarkPaths, opts: EmitOptions = {}): string {
  const { color = '#1c1a17', background, size = 1000 } = opts;
  const optimized = optimizeMark(mark);
  const body = optimized.paths
    .map((p) =>
      p.role === 'fill'
        ? `<path d="${p.d}" fill="${color}" fill-rule="nonzero"/>`
        : `<path d="${p.d}" fill="none" stroke="${color}" stroke-width="${round3(p.strokeWidth ?? 20)}" stroke-linecap="round"/>`,
    )
    .join('\n  ');
  const bg = background ? `<rect width="1000" height="1000" fill="${background}"/>\n  ` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">\n  ${bg}${body}\n</svg>`;
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
