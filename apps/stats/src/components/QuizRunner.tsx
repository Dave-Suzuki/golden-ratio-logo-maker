'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { finishSession, nextQuestion, submitAnswer } from '@/lib/actions';
import { currentQuestion, specLabel, useStats } from '@/lib/store';
import type { Given, TeachSnippet } from '@/lib/types';
import { FeedbackPanel } from './FeedbackPanel';
import { QuestionStem } from './QuestionStem';
import { ScoreSummary } from './ScoreSummary';
import { FillInput } from './inputs/FillInput';
import { McInput } from './inputs/McInput';
import { NumericInput } from './inputs/NumericInput';
import { OpenInput } from './inputs/OpenInput';
import { TfInput } from './inputs/TfInput';

const teachCache = new Map<string, TeachSnippet | null>();

async function loadTeach(sectionId: string | null): Promise<TeachSnippet | null> {
  if (!sectionId) return null;
  if (teachCache.has(sectionId)) return teachCache.get(sectionId) ?? null;
  try {
    const res = await fetch(`/api/teach/${sectionId}`);
    const data = (await res.json()) as { teach: TeachSnippet | null };
    teachCache.set(sectionId, data.teach);
    return data.teach;
  } catch {
    return null;
  }
}

export function QuizRunner() {
  const session = useStats((s) => s.session);
  const profile = useStats((s) => s.profile);
  const error = useStats((s) => s.error);
  const q = currentQuestion(session);
  const [mc, setMc] = useState<number | null>(null);
  const [num, setNum] = useState('');
  const [fill, setFill] = useState<string[]>([]);
  const [tf, setTf] = useState<boolean | null>(null);
  const [open, setOpen] = useState('');
  const [teach, setTeach] = useState<TeachSnippet | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setMc(null);
    setNum('');
    setFill([]);
    setTf(null);
    setOpen('');
    if (q) void loadTeach(q.sectionId).then(setTeach);
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session && session.index >= session.test.questions.length && !finished) {
      setFinished(true);
      void finishSession();
    }
  }, [session, finished]);

  if (!session) return null;
  if (!q) return <ScoreSummary session={session} />;

  const given = session.given[session.index];
  const result = session.results[session.index];
  const answered = result !== null && result !== undefined && (result.correct !== null || given?.kind !== 'open');
  const total = session.test.questions.length;

  const buildGiven = (): Given | null => {
    switch (q.kind) {
      case 'mc':
        return mc === null ? null : { kind: 'mc', index: mc };
      case 'numeric':
        return num.trim() ? { kind: 'numeric', raw: num } : null;
      case 'fill':
        return fill.some((v) => v?.trim()) ? { kind: 'fill', values: fill } : null;
      case 'tf':
        return tf === null ? null : { kind: 'tf', value: tf };
      case 'open':
        return { kind: 'open', text: open };
    }
  };
  const revealed = q.kind === 'open' && given?.kind === 'open' && !given.selfMark;
  const locked = answered || revealed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs opacity-70">
        <span>
          {specLabel(session.test.spec)} · question {session.index + 1} of {total}
          {q.sectionId ? ` · §${q.sectionId}` : ''}
        </span>
        <span>{profile ? profile.name : 'not saved — pick a learner on the home page'}</span>
      </div>
      <div className="rounded-lg border border-[var(--line)] bg-white p-5">
        <QuestionStem stem={q.stem} context={q.context} />
        <div className="mt-4">
          {q.kind === 'mc' && <McInput options={q.options} value={mc} onChange={setMc} disabled={locked} />}
          {q.kind === 'numeric' && <NumericInput value={num} onChange={setNum} unit={q.unit} disabled={locked} />}
          {q.kind === 'fill' && <FillInput blanks={q.blanks} symbolSet={q.symbolSet} values={fill} onChange={setFill} disabled={locked} />}
          {q.kind === 'tf' && <TfInput value={tf} onChange={setTf} disabled={locked} />}
          {q.kind === 'open' && <OpenInput value={open} onChange={setOpen} disabled={locked} />}
        </div>
        {!locked && (
          <button
            onClick={() => {
              const g = buildGiven();
              if (g) void submitAnswer(g);
            }}
            className="mt-4 rounded bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            {q.kind === 'open' ? 'Show model solution' : 'Check answer'}
          </button>
        )}
      </div>

      {revealed && (
        <div className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm">
          <p className="font-semibold">Model solution</p>
          <div className="mt-1 whitespace-pre-line rounded bg-[var(--accent-soft)]/50 p-3">{q.modelSolution}</div>
          <p className="mt-3">Compare with your work. Did you get it?</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => void submitAnswer({ kind: 'open', text: open, selfMark: 'got' })} className="rounded bg-[var(--ok)] px-4 py-2 text-white">
              I got it
            </button>
            <button onClick={() => void submitAnswer({ kind: 'open', text: open, selfMark: 'missed' })} className="rounded bg-[var(--bad)] px-4 py-2 text-white">
              I missed it
            </button>
          </div>
        </div>
      )}

      {answered && given && result && (
        <>
          <FeedbackPanel q={q} given={given} result={result} teach={teach} />
          <div className="flex justify-end">
            <button onClick={nextQuestion} className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-white">
              {session.index + 1 < total ? 'Next question' : 'Finish'}
            </button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      <p className="text-xs opacity-50">
        <Link href="/" className="underline">
          Quit to chapters
        </Link>
      </p>
    </div>
  );
}
