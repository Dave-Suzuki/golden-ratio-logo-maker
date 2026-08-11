'use client';

import { PDFDocument, rgb } from 'pdf-lib';
import { fitViewBox, optimizeMark, type RenderResult } from '@kiwari/engine';

/**
 * Mark → single-page PDF via pdf-lib's drawSvgPath. Our marks are pure path
 * data, so no SVG rendering stack is needed. drawSvgPath interprets SVG
 * coordinates (y-down) relative to the given x/y as top-left.
 */
export async function markPdf(result: RenderResult, name: string): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${name} — constructed mark`);
  const pageSize = 600;
  const page = doc.addPage([pageSize, pageSize]);

  const vb = fitViewBox(result.mark.bounds);
  const scale = pageSize / vb.w;
  const ink = rgb(0.11, 0.1, 0.09);

  const optimized = optimizeMark(result.mark);
  for (const p of optimized.paths) {
    if (p.role === 'fill') {
      page.drawSvgPath(p.d, { x: -vb.x * scale, y: pageSize + vb.y * scale, scale, color: ink });
    } else {
      page.drawSvgPath(p.d, {
        x: -vb.x * scale,
        y: pageSize + vb.y * scale,
        scale,
        borderColor: ink,
        borderWidth: (p.strokeWidth ?? 20) * scale,
      });
    }
  }

  const bytes = await doc.save();
  return new Blob([bytes as unknown as ArrayBuffer], { type: 'application/pdf' });
}
