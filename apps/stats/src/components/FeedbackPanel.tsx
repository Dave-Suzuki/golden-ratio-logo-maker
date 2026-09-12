'use client';

import { useEffect, useState } from 'react';
import { fetchExplanation } from '@/lib/actions';
import { useStats } from '@/lib/store';
import type { GradeResult, Given, Question, TeachSnippet } from '@/lib/types';
import { Clamp } from './Clamp';
import { RichText } from './RichText';
import { TeachPanel } from './TeachPanel';

export function FeedbackPanel({ q, given, result, teach }: { q: Question; given: Given; result: GradeResult; teach: TeachSnippet | null }) {
  const aiEnabled = useStats((s) => s.aiEnabled);
  const [showTeach, setShowTeach] = useState(false);
  const [deeper, setDeeper] = useState<string[] | null | 'loading'>(null);
  useEffect(() => {
    setShowTeach(false);
    setDeeper(null);
  }, [q.id]);
  const ok = result.correct === true;
  const explanation = q.kind === 'open' ? [] : q.explanation;
  return (
    <div className={`rounded-lg border p-4 text-sm ${ok ? 'border-[var(--ok)] bg-[var(--ok-soft)]' : 'border-[var(--bad)] bg-[var(--bad-soft)]'}`}>
      <p className="font-semibold">{ok ? 'Correct.' : result.correct === false ? 'Not quite.' : ''}</p>
      {!ok && q.kind !== 'open' && (
        <p className="mt-1">
          <span className="opacity-70">Correct answer: </span>
          <span className="font-medium whitespace-pre-line">{result.correctDisplay}</span>
        </p>
      )}
      {q.kind === 'open' && (
        <div className="mt-2">
          <span className="opacity-70">Model solution:</span>
          <div className="mt-1 rounded bg-white/70 p-2">
            <Clamp maxPx={320} measureKey={q.id} openLabel="Show the whole answer">
              <RichText text={q.modelSolution} />
            </Clamp>
          </div>
        </div>
      )}
      {result.perBlank && (
        <p className="mt-1 opacity-70">
          Blanks: {result.perBlank.map((b, i) => `${q.kind === 'fill' ? q.blanks[i]?.label : i + 1} ${b ? '✓' : '✗'}`).join(' · ')}
        </p>
      )}
      {explanation.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {explanation.map((e, i) => (
            <li key={i}>
              <RichText text={e} variant="compact" />
            </li>
          ))}
        </ol>
      )}
      {!ok && (
        <div className="mt-3 flex flex-wrap gap-2">
          {teach && (
            <button onClick={() => setShowTeach((v) => !v)} className="rounded border border-[var(--line)] bg-white px-3 py-1">
              {showTeach ? 'Hide' : 'Show me the essentials'}
            </button>
          )}
          {aiEnabled && deeper === null && (
            <button
              onClick={async () => {
                setDeeper('loading');
                setDeeper(await fetchExplanation(q, given));
              }}
              className="rounded border border-[var(--line)] bg-white px-3 py-1"
            >
              Deeper explanation
            </button>
          )}
        </div>
      )}
      {deeper === 'loading' && <p className="mt-2 opacity-60">Thinking…</p>}
      {Array.isArray(deeper) && (
        <ol className="mt-2 list-decimal space-y-1 rounded bg-white/70 p-3 pl-8">
          {deeper.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ol>
      )}
      {showTeach && teach && (
        <div className="mt-3 rounded bg-white/80 p-3">
          <TeachPanel teach={teach} mode="miss" focus={`${q.stem} ${q.kind === 'mc' ? q.options.join(' ') : ''}`} />
        </div>
      )}
    </div>
  );
}
