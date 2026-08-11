'use client';

import { useEffect, useState } from 'react';
import { emitSvg, fitViewBox, PHI } from '@kiwari/engine';
import { downloadText } from '@/lib/export/download';
import { outlineText, type OutlinedText } from '@/lib/export/outlineText';
import { slugify } from '@/lib/export/iconSet';
import { useStudio } from '@/lib/store';
import { MarkPathsSvg, useRender } from './MarkSvg';

type Layout = 'horizontal' | 'stacked';

/**
 * Wordmark lockup (GEN-5): mark + outlined type with φ-derived clearspace.
 * Gap and clearspace are cap-height·φ⁻¹ and cap-height·φ — even the whitespace
 * sits on the series, and the guides show it.
 */
export function LockupEditor() {
  const { workingPlan, brief, tier } = useStudio();
  const result = useRender(workingPlan);
  const [layout, setLayout] = useState<Layout>('horizontal');
  const [word, setWord] = useState<OutlinedText | null>(null);
  const [guides, setGuides] = useState(true);
  const name = brief?.name && brief.name !== 'Untitled' ? brief.name : null;

  useEffect(() => {
    let cancelled = false;
    if (name) {
      outlineText(name, 100)
        .then((w) => {
          if (!cancelled) setWord(w);
        })
        .catch(() => setWord(null));
    }
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!workingPlan || !result || !name || !word) return null;

  const cap = word.capHeight; // wordmark cap height in local units
  const markSide = cap * PHI * PHI; // mark height = cap·φ²
  const gap = cap * PHI; // mark↔type gap = cap·φ
  const clear = cap * PHI; // clearspace = cap·φ (shown as guides)

  const vb = fitViewBox(result.mark.bounds);
  const markScale = markSide / vb.w;

  let width: number;
  let height: number;
  let markX = clear;
  let markY = clear;
  let wordX: number;
  let wordBaselineY: number;
  if (layout === 'horizontal') {
    width = clear * 2 + markSide + gap + word.width;
    height = clear * 2 + markSide;
    wordX = clear + markSide + gap;
    wordBaselineY = clear + markSide / 2 + cap / 2;
  } else {
    width = clear * 2 + Math.max(markSide, word.width);
    height = clear * 2 + markSide + gap + cap;
    markX = (width - markSide) / 2;
    wordX = (width - word.width) / 2;
    wordBaselineY = clear + markSide + gap + cap;
  }

  const lockupSvg = (withGuides: boolean) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(width)} ${r(height)}" width="${r(width * 4)}" height="${r(height * 4)}">
  <g transform="translate(${r(markX)} ${r(markY)}) scale(${r6(markScale)}) translate(${r(-vb.x)} ${r(-vb.y)})">
    ${result.mark.paths
      .map((p) =>
        p.role === 'fill'
          ? `<path d="${p.d}" fill="#1c1a17" fill-rule="nonzero"/>`
          : `<path d="${p.d}" fill="none" stroke="#1c1a17" stroke-width="${p.strokeWidth}" stroke-linecap="round"/>`,
      )
      .join('\n    ')}
  </g>
  <path d="${word.d}" transform="translate(${r(wordX)} ${r(wordBaselineY)})" fill="#1c1a17"/>
  ${withGuides ? `<rect x="${r(clear / 2)}" y="${r(clear / 2)}" width="${r(width - clear)}" height="${r(height - clear)}" fill="none" stroke="#b8860b" stroke-width="0.75" stroke-dasharray="4 4"/>` : ''}
</svg>`;

  return (
    <section className="mx-auto mt-10 max-w-5xl">
      <div className="mb-2 flex items-center gap-3">
        <p className="text-xs uppercase tracking-wide opacity-60">Lockup — clearspace is cap-height·φ</p>
        <button
          onClick={() => setLayout(layout === 'horizontal' ? 'stacked' : 'horizontal')}
          className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs hover:border-[var(--accent)]"
        >
          {layout === 'horizontal' ? 'stack it' : 'side by side'}
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs">
          <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
          clearspace guides
        </label>
        <button
          onClick={() => downloadText(lockupSvg(false), `${slugify(name)}-lockup.svg`)}
          disabled={tier !== 'paid'}
          title={tier === 'paid' ? 'type is outlined to paths — no font files shipped' : 'lockup SVG export is part of the Mark tier'}
          className="ml-auto rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-30"
        >
          Export lockup SVG
        </button>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <svg viewBox={`0 0 ${r(width)} ${r(height)}`} className="mx-auto max-h-64 w-full">
          <g transform={`translate(${r(markX)} ${r(markY)}) scale(${r6(markScale)}) translate(${r(-vb.x)} ${r(-vb.y)})`}>
            <MarkPathsSvg result={result} />
          </g>
          <path d={word.d} transform={`translate(${r(wordX)} ${r(wordBaselineY)})`} fill="#1c1a17" />
          {guides && (
            <>
              <rect
                x={r(clear / 2)}
                y={r(clear / 2)}
                width={r(width - clear)}
                height={r(height - clear)}
                fill="none"
                stroke="#b8860b"
                strokeWidth={0.75}
                strokeDasharray="4 4"
              />
              <text x={r(clear / 2 + 4)} y={r(clear / 2 - 4)} fontSize={8} fill="#b8860b" fontStyle="italic">
                clearspace = cap·φ
              </text>
            </>
          )}
        </svg>
        <p className="mt-2 text-center text-[10px] uppercase tracking-wide opacity-40">
          Fraunces (SIL OFL) — outlined to paths on export, no font redistribution
        </p>
      </div>
    </section>
  );
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}
function r6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
