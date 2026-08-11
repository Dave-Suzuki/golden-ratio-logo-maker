'use client';

import { analyzeLegibility, fitViewBox, type ConstructionPlan } from '@kiwari/engine';
import { useMemo } from 'react';
import { MarkPathsSvg, useRender } from './MarkSvg';

/**
 * The check surface (ANA-2): the real SVG at small sizes, monochrome, inverted,
 * and on-photo, with automatic geometric legibility flags.
 */
export function CheckStrip({ plan }: { plan: ConstructionPlan }) {
  const result = useRender(plan);
  const flags = useMemo(() => analyzeLegibility(plan), [plan]);
  if (!result) return null;
  const vb = fitViewBox(result.mark.bounds);
  const vbAttr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  const tile = 'flex flex-col items-center justify-end gap-1 rounded-lg border border-[var(--line)] bg-white p-3';
  const label = 'text-[10px] uppercase tracking-wide opacity-40';

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide opacity-60">Check — sizes, mono, inverted, in context</p>
      <div className="flex flex-wrap items-stretch gap-2">
        {[16, 32, 60].map((size) => (
          <div key={size} className={tile}>
            <svg viewBox={vbAttr} width={size} height={size} aria-label={`${size}px preview`}>
              <MarkPathsSvg result={result} />
            </svg>
            <span className={label}>{size}px</span>
          </div>
        ))}
        <div className={tile}>
          <svg viewBox={vbAttr} width={60} height={60}>
            <MarkPathsSvg result={result} color="#000000" />
          </svg>
          <span className={label}>mono</span>
        </div>
        <div className="flex flex-col items-center justify-end gap-1 rounded-lg border border-[var(--line)] bg-[#111] p-3">
          <svg viewBox={vbAttr} width={60} height={60}>
            <MarkPathsSvg result={result} color="#ffffff" />
          </svg>
          <span className="text-[10px] uppercase tracking-wide text-white/40">inverted</span>
        </div>
        <div
          className="flex flex-col items-center justify-end gap-1 rounded-lg border border-[var(--line)] p-3"
          style={{ background: 'linear-gradient(135deg, #7a6a52 0%, #b09a76 45%, #4a4238 100%)' }}
        >
          <svg viewBox={vbAttr} width={60} height={60}>
            <MarkPathsSvg result={result} color="#ffffff" />
          </svg>
          <span className="text-[10px] uppercase tracking-wide text-white/50">on photo</span>
        </div>
      </div>
      {flags.length > 0 && (
        <ul className="mt-2 space-y-1">
          {flags.map((f, i) => (
            <li key={i} className={`text-xs ${f.severity === 'fail' ? 'text-red-700' : 'text-amber-700'}`}>
              ⚠ {f.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
