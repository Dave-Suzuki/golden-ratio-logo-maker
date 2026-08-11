'use client';

import { useState } from 'react';
import { emitSvg, generatePalette, optimizeMark } from '@kiwari/engine';
import { downloadBlob, downloadText } from '@/lib/export/download';
import { buildIconZip, slugify } from '@/lib/export/iconSet';
import { markPdf } from '@/lib/export/pdf';
import { svgToPng } from '@/lib/export/raster';
import { useStudio } from '@/lib/store';
import { useRender } from './MarkSvg';

const rowBtn =
  'rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

export function ExportDialog() {
  const { workingPlan, brief, tier, seed } = useStudio();
  const result = useRender(workingPlan);
  const [busy, setBusy] = useState<string | null>(null);
  if (!workingPlan || !result) return null;

  const name = brief?.name ?? 'mark';
  const slug = slugify(name);
  const paid = tier === 'paid';
  const palette = brief ? generatePalette(brief, seed) : null;
  const brandColor = palette?.base ?? '#1c1a17';

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const nodeCount = optimizeMark(result.mark).nodeCount;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide opacity-60">Export</p>
        <TierToggle />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={rowBtn}
          disabled={busy !== null}
          onClick={() =>
            void run('png', async () => {
              downloadBlob(await svgToPng(emitSvg(result.mark, { fit: true }), 512), `${slug}-512.png`);
            })
          }
        >
          {busy === 'png' ? '…' : 'PNG 512px'} <span className="opacity-40">free</span>
        </button>
        <button
          className={rowBtn}
          disabled={!paid || busy !== null}
          title={paid ? undefined : 'SVG export is part of the Mark tier'}
          onClick={() => downloadText(emitSvg(result.mark, { fit: true }), `${slug}.svg`)}
        >
          SVG <span className="opacity-40">{nodeCount} nodes</span>
        </button>
        <button
          className={rowBtn}
          disabled={!paid || busy !== null}
          onClick={() =>
            void run('png8', async () => {
              downloadBlob(await svgToPng(emitSvg(result.mark, { fit: true }), 4096), `${slug}-4096.png`);
            })
          }
        >
          {busy === 'png8' ? '…' : 'PNG 4096px'}
        </button>
        <button
          className={rowBtn}
          disabled={!paid || busy !== null}
          onClick={() =>
            void run('icons', async () => {
              downloadBlob(await buildIconZip(result, name, brandColor), `${slug}-icons.zip`);
            })
          }
        >
          {busy === 'icons' ? 'building…' : 'Icon set + variants (zip)'}
        </button>
        <button
          className={rowBtn}
          disabled={!paid || busy !== null}
          onClick={() =>
            void run('pdf', async () => {
              downloadBlob(await markPdf(result, name), `${slug}.pdf`);
            })
          }
        >
          {busy === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          className={rowBtn}
          disabled={!paid}
          title="opens a print-styled page — save as PDF from the browser"
          onClick={() => {
            window.sessionStorage.setItem('kiwari-sheet', JSON.stringify({ plan: workingPlan, brief, seed }));
            window.open('/sheet', '_blank');
          }}
        >
          Construction sheet
        </button>
      </div>
      {!paid && (
        <p className="mt-2 text-xs opacity-60">
          Free ships PNG up to 512px. The Mark tier ($49, one mark, yours forever) unlocks SVG, the full icon set,
          variants, and the construction sheet — flip the toggle to preview it here.
        </p>
      )}
    </div>
  );
}

export function TierToggle() {
  const { tier } = useStudio();
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={tier === 'paid'}
        onChange={(e) => useStudio.getState().setTier(e.target.checked ? 'paid' : 'free')}
      />
      <span>
        Mark tier <span className="opacity-50">(demo toggle — no payment wired)</span>
      </span>
    </label>
  );
}
