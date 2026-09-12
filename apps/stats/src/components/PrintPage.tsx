'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchTest, specToQuery } from '@/lib/actions';
import { formatAnswer } from '@/lib/grade';
import { specLabel } from '@/lib/store';
import type { Test } from '@/lib/types';
import { RichText } from './RichText';
import { specFromParams } from './QuizPage';

export function PrintPage() {
  const params = useSearchParams();
  const router = useRouter();
  const spec = specFromParams(params);
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = params.toString();
  useEffect(() => {
    if (!spec) return;
    setTest(null);
    fetchTest(spec)
      .then(setTest)
      .catch((e: Error) => setError(e.message));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!spec) return <p className="text-sm">No test specified.</p>;
  if (error) return <p className="text-sm text-[var(--bad)]">{error}</p>;
  if (!test) return <p className="text-sm opacity-60">Building the test…</p>;
  const title = specLabel(spec);
  const newSeed = () => router.replace(`/print?${specToQuery({ ...spec, seed: Math.floor(Math.random() * 1_000_000) })}`);
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-[13px] leading-relaxed print:p-0">
      <div className="no-print mb-4 flex flex-wrap gap-2 text-sm">
        <button onClick={() => window.print()} className="rounded bg-[var(--accent)] px-4 py-2 text-white">
          Print / save as PDF
        </button>
        {spec.scope !== 'practice-test' && spec.scope !== 'final' && (
          <button onClick={newSeed} className="rounded border border-[var(--line)] px-4 py-2">
            New test (different questions)
          </button>
        )}
        <span className="self-center text-xs opacity-60">Test code {spec.scope}:{spec.id}:{spec.seed} — the same code always reproduces this exact test and key.</span>
      </div>

      <header className="border-b border-black/30 pb-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-xs opacity-70">
          Introductory Statistics · {test.questions.length} questions · test code {spec.scope}:{spec.id}:{spec.seed}
        </p>
        <p className="mt-2 text-xs">Name: ______________________________ &nbsp;&nbsp; Date: ______________ &nbsp;&nbsp; Score: ______ / {test.questions.length}</p>
      </header>

      <ol className="mt-4 space-y-5">
        {test.questions.map((q, i) => (
          <li key={q.id} className="print-item flex gap-3">
            <span className="w-6 shrink-0 font-semibold">{i + 1}.</span>
            <div className="grow">
              {q.context &&
                (i > 0 && test.questions[i - 1]?.context === q.context ? (
                  <p className="mb-1 text-[11px] italic opacity-70">Same information as question {i}.</p>
                ) : (
                  <RichText text={q.context} variant="print" className="mb-1 opacity-80" />
                ))}
              <RichText text={q.stem} variant="print" />
              {q.kind === 'mc' && (
                <ul className="mt-1 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                  {q.options.map((o, j) => (
                    <li key={j}>
                      <span className="mr-1 inline-block h-3.5 w-3.5 rounded-full border border-black/60 align-middle" /> {String.fromCharCode(97 + j)}. {o}
                    </li>
                  ))}
                </ul>
              )}
              {q.kind === 'numeric' && <p className="mt-1">Answer: ______________________ {q.unit ?? ''}</p>}
              {q.kind === 'tf' && <p className="mt-1">Circle one: &nbsp; True &nbsp;&nbsp; False</p>}
              {q.kind === 'fill' && (
                <p className="mt-1">
                  {q.blanks.map((b) => (
                    <span key={b.label} className="mr-6">
                      {b.label} ________
                    </span>
                  ))}
                </p>
              )}
              {q.kind === 'open' && <div className="mt-2 h-20 rounded border border-dashed border-black/30" />}
            </div>
          </li>
        ))}
      </ol>

      <section className="page-break mt-10 border-t border-black/30 pt-4">
        <h2 className="text-lg font-semibold">Answer key — {title}</h2>
        <p className="text-xs opacity-70">test code {spec.scope}:{spec.id}:{spec.seed}</p>
        <ol className="mt-3 space-y-2">
          {test.questions.map((q, i) => (
            <li key={q.id} className="print-item flex gap-3">
              <span className="w-6 shrink-0 font-semibold">{i + 1}.</span>
              <div>
                <span className="font-medium whitespace-pre-line">{formatAnswer(q)}</span>
                {q.kind !== 'open' && q.explanation.length > 0 && <span className="block text-xs opacity-70">{q.explanation.join(' · ')}</span>}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[10px] opacity-60">
          Questions adapted from Introductory Statistics 2e (OpenStax, Rice University), CC BY 4.0. Extra practice items carry their own license; see the About page.
        </p>
      </section>
    </div>
  );
}
