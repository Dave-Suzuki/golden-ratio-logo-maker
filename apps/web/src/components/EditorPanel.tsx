'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { rationaleFor } from '@kiwari/engine';
import { fetchRationale } from '@/lib/actions';
import { useStudio, type RevealLayers } from '@/lib/store';
import { CheckStrip } from './CheckStrip';
import { MarkPathsSvg, useRender } from './MarkSvg';
import { RefinePanel } from './RefinePanel';
import { RevealOverlay } from './RevealOverlay';
import { ExportDialog } from './ExportDialog';

const LAYER_LABELS: Record<keyof RevealLayers, string> = {
  rects: 'golden rects',
  grid: 'grid',
  circles: 'circle chain',
  spiral: 'φ spiral',
  anchors: 'anchors',
  labels: 'labels',
};

/**
 * The selected-mark workspace: big canvas with the construction reveal
 * (the moment that sells), refine controls, rationale, checks, export.
 */
export function EditorPanel() {
  const { workingPlan, brief, revealOpen, revealLayers, rationale } = useStudio();
  const opticalNote = Boolean(workingPlan?.optical.enabled && workingPlan.optical.corrections.length > 0);
  const result = useRender(workingPlan);

  useEffect(() => {
    if (workingPlan && !rationale) void fetchRationale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingPlan]);

  if (!workingPlan || !result) return null;
  const shownRationale = rationale ?? (brief ? rationaleFor(workingPlan, brief) : rationaleFor(workingPlan));

  return (
    <section className="mx-auto mt-10 max-w-5xl border-t border-[var(--line)] pt-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
            <svg viewBox="0 0 1000 1000" className="w-full" key={revealOpen ? 'reveal' : 'plain'}>
              <MarkPathsSvg result={result} dimmed={revealOpen} />
              {revealOpen && <RevealOverlay result={result} layers={revealLayers} />}
            </svg>
            <button
              onClick={() => useStudio.getState().setRevealOpen(!revealOpen)}
              className="absolute right-3 top-3 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] shadow"
            >
              {revealOpen ? 'Hide construction' : 'Show the construction'}
            </button>
          </div>
          {revealOpen && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {(Object.keys(LAYER_LABELS) as (keyof RevealLayers)[]).map((layer) => (
                <label key={layer} className="inline-flex cursor-pointer items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={revealLayers[layer]}
                    onChange={() => useStudio.getState().toggleRevealLayer(layer)}
                  />
                  {LAYER_LABELS[layer]}
                </label>
              ))}
              <Link href="/is-this-real" className="ml-auto text-xs italic text-[var(--accent)] underline">
                Is this real? What φ does and doesn&apos;t do →
              </Link>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm leading-relaxed">{shownRationale}</p>
            {opticalNote && (
              <p className="mt-2 text-xs opacity-60">
                Optical corrections are on — {workingPlan.optical.corrections.map((c) => c.reason).join('; ')}. Toggle
                them off to see the pure mathematical state.
              </p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-wide opacity-40">
              {result.mark.nodeCount} nodes · {workingPlan.family.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <RefinePanel />
          <CheckStrip plan={workingPlan} />
          <ExportDialog />
        </div>
      </div>
    </section>
  );
}
