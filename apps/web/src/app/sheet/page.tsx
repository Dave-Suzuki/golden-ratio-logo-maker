'use client';

import { useEffect, useState } from 'react';
import {
  analyzeLegibility,
  generatePalette,
  rationaleFor,
  validatePlan,
  type BrandBrief,
  type ConstructionPlan,
} from '@kiwari/engine';
import { MarkPathsSvg, useRender } from '@/components/MarkSvg';
import { RevealOverlay } from '@/components/RevealOverlay';

interface SheetData {
  plan: ConstructionPlan;
  brief: BrandBrief | null;
  seed: number;
}

/**
 * The construction sheet (EXP-5): a print-styled page — use the browser's
 * print-to-PDF. Data arrives via sessionStorage from the studio's export panel.
 */
export default function SheetPage() {
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('kiwari-sheet');
      if (!raw) throw new Error('no sheet data');
      const parsed = JSON.parse(raw) as SheetData;
      const v = validatePlan(parsed.plan);
      if (!v.ok) throw new Error('invalid plan');
      setData({ plan: v.plan, brief: parsed.brief ?? null, seed: parsed.seed ?? 1 });
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <main className="p-10 text-sm">
        No mark loaded. Open the studio, pick a mark, and use “Construction sheet” in the export panel.
      </main>
    );
  }
  if (!data) return null;
  return <Sheet {...data} />;
}

function Sheet({ plan, brief, seed }: SheetData) {
  const result = useRender(plan);
  if (!result) return null;
  const name = brief?.name ?? 'Untitled';
  const flags = analyzeLegibility(plan);
  const palette = brief ? generatePalette(brief, seed) : null;
  const steps = [...new Set(plan.elements.flatMap((e) => ('r' in e ? [e.r.step] : [])))].sort((a, b) => b - a);
  const sym = plan.family === 'root2_grid' ? '√2' : 'φ';

  return (
    <main className="mx-auto max-w-3xl bg-white p-10 text-[13px] leading-relaxed print:p-0">
      <div className="flex items-baseline justify-between border-b border-black/20 pb-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            {name} — construction sheet
          </h1>
          <p className="opacity-60">
            {plan.family.replace(/_/g, ' ')} · seed {seed} · {result.mark.nodeCount} nodes · Kiwari
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded border border-black/20 px-3 py-1 text-xs print:hidden"
        >
          Print / save as PDF
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <figure>
          <svg viewBox="0 0 1000 1000" className="w-full border border-black/10">
            <MarkPathsSvg result={result} />
          </svg>
          <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide opacity-50">the mark</figcaption>
        </figure>
        <figure>
          <svg viewBox="0 0 1000 1000" className="w-full border border-black/10">
            <MarkPathsSvg result={result} dimmed />
            <RevealOverlay
              result={result}
              layers={{ grid: true, rects: true, circles: true, spiral: true, anchors: true, labels: true }}
            />
          </svg>
          <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide opacity-50">
            its construction
          </figcaption>
        </figure>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Why this shape is this shape</h2>
        <p className="mt-1">{rationaleFor(plan, brief ?? undefined)}</p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">The numbers</h2>
          <table className="mt-1 w-full text-left">
            <tbody>
              <tr>
                <td className="pr-3 opacity-60">proportion series</td>
                <td>
                  r = r₀·{sym}
                  <sup>n</sup>, n ∈ {'{'}
                  {steps.join(', ')}
                  {'}'}
                </td>
              </tr>
              <tr>
                <td className="pr-3 opacity-60">lattice</td>
                <td>
                  {plan.canvas.lattice.replace(/_/g, ' ')} · depth {plan.canvas.depth}
                </td>
              </tr>
              <tr>
                <td className="pr-3 opacity-60">anchors used</td>
                <td>{result.construction.anchors.map((a) => a.id).join(', ')}</td>
              </tr>
              {plan.style.strokeStep !== null && (
                <tr>
                  <td className="pr-3 opacity-60">stroke weight</td>
                  <td>
                    w₀·φ<sup>{plan.style.strokeStep}</sup>
                  </td>
                </tr>
              )}
              <tr>
                <td className="pr-3 opacity-60">optical corrections</td>
                <td>
                  {plan.optical.corrections.length === 0
                    ? 'none — pure mathematical state'
                    : plan.optical.corrections.map((c) => `${c.reason} (${c.dx}, ${c.dy})`).join('; ')}
                </td>
              </tr>
              {flags.map((f, i) => (
                <tr key={i}>
                  <td className="pr-3 opacity-60">legibility</td>
                  <td>{f.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {palette && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">Palette (golden-angle rotation)</h2>
            <div className="mt-1 flex gap-2">
              {[palette.base, ...palette.accents].map((hex) => (
                <div key={hex} className="text-center">
                  <div className="h-10 w-14 rounded border border-black/10" style={{ background: hex }} />
                  <p className="mt-0.5 font-mono text-[9px]">{hex}</p>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] opacity-60">
              All displayed text pairs pass WCAG AA (≥ 4.5:1): {palette.pairs.map((p) => `${p.ratio}:1`).join(' · ')}
            </p>
          </div>
        )}
      </section>

      <footer className="mt-8 border-t border-black/20 pt-2 text-[10px] opacity-60">
        This sheet documents how the mark is built: a measure of internal consistency, not of beauty, memorability, or
        fit for your business — no algorithm measures those. Generation is not trademark clearance: before committing,
        search uspto.gov / j-platpat.inpit.go.jp. Constructed with Kiwari — every logo shows its work.
      </footer>
    </main>
  );
}
