'use client';

import { useState } from 'react';
import { generateFromPrompt } from '@/lib/actions';
import { useStudio } from '@/lib/store';

const EXAMPLES = [
  'A coffee roastery in Kirkland called "Kessa". Warm but precise. Something to do with a crescent.',
  'A bold developer-tools startup called "Vector Labs". Abstract, minimal, has to work at 16px.',
  'A calm stationery studio called "Hanshi" built on the yamato ratio. Modular and quiet.',
];

export function DescribeBox() {
  const { interpreting, generating } = useStudio();
  const [text, setText] = useState('');
  const busy = interpreting || generating;

  const go = () => {
    if (text.trim().length === 0 || busy) return;
    void generateFromPrompt(text.trim());
  };

  return (
    <section className="mx-auto max-w-2xl">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) go();
        }}
        rows={3}
        placeholder="Describe what you want in one sentence — your business, a feeling, maybe a shape…"
        className="w-full rounded-xl border border-[var(--line)] bg-white p-4 text-base shadow-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs opacity-70 hover:opacity-100"
            >
              {ex.split('.')[0]}
            </button>
          ))}
        </div>
        <button
          onClick={go}
          disabled={busy || text.trim().length === 0}
          className="rounded-xl bg-[var(--ink)] px-6 py-2.5 font-medium text-[var(--paper)] disabled:opacity-40"
        >
          {interpreting ? 'Reading the brief…' : generating ? 'Constructing…' : 'Construct marks'}
        </button>
      </div>
    </section>
  );
}
