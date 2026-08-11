import type { MarkPath, MarkPaths } from '../render/types';

/**
 * Minimal, dependency-free SVG path optimization: round coordinates to 3 decimals
 * (trimming trailing zeros) and merge consecutive paths that share identical style
 * into one multi-subpath `d`. Winding stays intact, so nonzero fill is unaffected.
 */
export function optimizeMark(mark: MarkPaths): MarkPaths {
  const rounded = mark.paths.map((p) => ({ ...p, d: roundPathData(p.d) }));
  const merged: MarkPath[] = [];
  for (const p of rounded) {
    const last = merged[merged.length - 1];
    if (last && last.role === p.role && last.strokeWidth === p.strokeWidth) {
      last.d = `${last.d} ${p.d}`;
    } else {
      merged.push({ ...p });
    }
  }
  return { paths: merged, nodeCount: mark.nodeCount };
}

export function roundPathData(d: string): string {
  return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return n;
    return String(Number(v.toFixed(3)));
  });
}
