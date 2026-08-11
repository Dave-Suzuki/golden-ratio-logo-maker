'use client';

import { zipSync } from 'fflate';
import { emitSvg, type RenderResult } from '@kiwari/engine';
import { svgToPng } from './raster';

export const ICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512] as const;

/**
 * The full icon set (EXP-7): PNGs at every icon size, PNG favicons, a 1024px
 * social avatar on a brand-color disc, and the source SVGs — one zip.
 */
export async function buildIconZip(result: RenderResult, name: string, brandColor: string): Promise<Blob> {
  const slug = slugify(name);
  const fitSvg = emitSvg(result.mark, { fit: true });
  const monoSvg = emitSvg(result.mark, { fit: true, color: '#000000' });
  const invertedSvg = emitSvg(result.mark, { fit: true, color: '#ffffff', background: '#111111' });
  const singleSvg = emitSvg(result.mark, { fit: true, color: brandColor });

  const files: Record<string, Uint8Array> = {
    [`${slug}.svg`]: encode(fitSvg),
    [`${slug}-mono.svg`]: encode(monoSvg),
    [`${slug}-inverted.svg`]: encode(invertedSvg),
    [`${slug}-color.svg`]: encode(singleSvg),
  };

  for (const size of ICON_SIZES) {
    files[`icons/${slug}-${size}.png`] = await pngBytes(fitSvg, size);
  }
  files[`favicon-16.png`] = await pngBytes(fitSvg, 16);
  files[`favicon-32.png`] = await pngBytes(fitSvg, 32);

  const avatarSvg = emitSvg(result.mark, { fit: true, color: '#ffffff', background: brandColor });
  files[`${slug}-avatar-1024.png`] = await pngBytes(avatarSvg, 1024);

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.slice().buffer as ArrayBuffer], { type: 'application/zip' });
}

async function pngBytes(svg: string, size: number): Promise<Uint8Array> {
  const blob = await svgToPng(svg, size);
  return new Uint8Array(await blob.arrayBuffer());
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mark'
  );
}
