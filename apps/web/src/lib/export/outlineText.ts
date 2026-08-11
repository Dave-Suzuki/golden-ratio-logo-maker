'use client';

import * as opentype from 'opentype.js';

let fontPromise: Promise<opentype.Font> | null = null;

/** Bundled OFL typeface (Fraunces 600). Outlined on export — no font redistribution (GEN-7). */
export function loadBrandFont(): Promise<opentype.Font> {
  fontPromise ??= fetch('/fonts/Fraunces.ttf')
    .then((r) => {
      if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => opentype.parse(buf));
  return fontPromise;
}

export interface OutlinedText {
  /** SVG path data with the baseline at y = 0 */
  d: string;
  width: number;
  capHeight: number;
}

export async function outlineText(text: string, fontSize: number): Promise<OutlinedText> {
  const font = await loadBrandFont();
  const path = font.getPath(text, 0, 0, fontSize, { kerning: true });
  const capHeight = ((font.tables.os2?.sCapHeight ?? font.ascender * 0.72) / font.unitsPerEm) * fontSize;
  return {
    d: path.toPathData(3),
    width: font.getAdvanceWidth(text, fontSize, { kerning: true }),
    capHeight,
  };
}
