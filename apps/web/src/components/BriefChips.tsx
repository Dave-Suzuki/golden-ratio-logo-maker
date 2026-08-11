'use client';

import { useState } from 'react';
import type { BrandBrief } from '@kiwari/engine';
import { generateFromBrief } from '@/lib/actions';
import { useStudio } from '@/lib/store';

const CYCLES: Record<string, string[]> = {
  form_language: ['geometric', 'organic', 'calligraphic', 'modular'],
  logo_type: ['pictorial', 'abstract', 'lettermark', 'combination'],
  proportion_system: ['phi', 'root2'],
  temperature: ['warm', 'cool', 'neutral'],
};

const LABELS: Record<string, string> = { phi: 'φ construction', root2: '√2 construction' };

/**
 * The confirm-brief surface (IN-3): the system's interpretation reflected back
 * as editable chips. Tapping a chip cycles or edits the underlying parameter —
 * this is where a non-designer acquires vocabulary without a lesson.
 */
export function BriefChips() {
  const { brief, briefSource, seed, generating } = useStudio();
  const [editingSubject, setEditingSubject] = useState(false);
  if (!brief) return null;

  const update = (next: BrandBrief) => {
    useStudio.getState().setBrief(next, briefSource);
  };
  const regenerate = () => void generateFromBrief(brief, seed);
  const cycle = (field: keyof typeof CYCLES, current: string): string => {
    const values = CYCLES[field]!;
    return values[(values.indexOf(current) + 1) % values.length]!;
  };

  const chip =
    'rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:border-[var(--accent)] transition-colors';

  return (
    <section className="mx-auto mt-6 max-w-3xl">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide opacity-60">
          How we read it — tap anything that&apos;s wrong
        </p>
        <SourceBadge source={briefSource} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${chip} font-medium`}>{brief.name}</span>
        <span className={chip}>{brief.industry.split('/').pop()}</span>
        {brief.personality.map((p) => (
          <span key={p} className={`${chip} italic`}>
            {p}
          </span>
        ))}
        {editingSubject ? (
          <input
            autoFocus
            defaultValue={brief.motif.subject}
            onBlur={(e) => {
              update({ ...brief, motif: { ...brief.motif, subject: e.target.value || brief.motif.subject } });
              setEditingSubject(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-32 rounded-full border border-[var(--accent)] px-3 py-1.5 text-sm outline-none"
          />
        ) : (
          <button className={`${chip} border-dashed`} onClick={() => setEditingSubject(true)} title="click to edit the motif">
            {brief.motif.subject}
          </button>
        )}
        <button
          className={chip}
          onClick={() => update({ ...brief, form_language: cycle('form_language', brief.form_language) as BrandBrief['form_language'] })}
        >
          {brief.form_language}
        </button>
        <button
          className={chip}
          onClick={() => update({ ...brief, logo_type: cycle('logo_type', brief.logo_type) as BrandBrief['logo_type'] })}
        >
          {brief.logo_type} mark
        </button>
        <button
          className={`${chip} text-[var(--accent)]`}
          onClick={() =>
            update({ ...brief, proportion_system: cycle('proportion_system', brief.proportion_system) as BrandBrief['proportion_system'] })
          }
        >
          {LABELS[brief.proportion_system]}
        </button>
        <button
          className={chip}
          onClick={() =>
            update({
              ...brief,
              palette_intent: {
                ...brief.palette_intent,
                temperature: cycle('temperature', brief.palette_intent.temperature) as BrandBrief['palette_intent']['temperature'],
              },
            })
          }
        >
          {brief.palette_intent.temperature}
        </button>
        <button
          onClick={regenerate}
          disabled={generating}
          className="ml-auto rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {generating ? 'Constructing…' : 'Regenerate'}
        </button>
      </div>
    </section>
  );
}

export function SourceBadge({ source }: { source: 'llm' | 'fallback' | 'mixed' | null }) {
  if (!source) return null;
  const label = source === 'llm' ? 'Claude-planned' : source === 'mixed' ? 'Claude + templates' : 'template engine (no API key)';
  return (
    <span className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-50" title="Which planner produced this — honesty first.">
      {label}
    </span>
  );
}
