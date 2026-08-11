'use client';

import { useMemo } from 'react';
import { generatePalette } from '@kiwari/engine';
import { useStudio } from '@/lib/store';

/** Golden-angle palette (GEN-6): base hue from the brief, accents at +137.5° hops, WCAG-checked. */
export function PalettePanel() {
  const { brief, seed } = useStudio();
  const palette = useMemo(() => (brief ? generatePalette(brief, seed) : null), [brief, seed]);
  if (!palette) return null;

  const swatches = [
    { hex: palette.base, label: 'base' },
    ...palette.accents.map((hex, i) => ({ hex, label: `+${(137.5 * (i + 1)) % 360}°` })),
    { hex: palette.ink, label: 'ink' },
    { hex: palette.paper, label: 'paper' },
  ];

  return (
    <section className="mx-auto mt-10 max-w-5xl">
      <p className="mb-2 text-xs uppercase tracking-wide opacity-60">
        Palette — accents rotate the hue wheel by the golden angle (137.5°)
      </p>
      <div className="flex flex-wrap gap-3">
        {swatches.map((s) => (
          <div key={s.label} className="w-24 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
            <div className="h-14" style={{ background: s.hex }} />
            <div className="p-1.5 text-center">
              <p className="font-mono text-[10px]">{s.hex}</p>
              <p className="text-[9px] uppercase tracking-wide opacity-40">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="flex flex-col justify-center gap-1 text-xs opacity-70">
          {palette.pairs.map((p, i) => (
            <span key={i}>
              <span className="rounded px-1.5 py-0.5" style={{ color: p.fg, background: p.bg }}>
                Aa
              </span>{' '}
              {p.ratio}:1 {p.ratio >= 4.5 ? '✓ WCAG AA' : '✗'}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
