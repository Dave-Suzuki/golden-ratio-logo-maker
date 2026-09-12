'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finishSession, nextQuestion, submitAnswer } from '@/lib/actions';
import { refresherSectionFor } from '@/lib/refresher';
import { currentQuestion, specLabel, useStats } from '@/lib/store';
import type { Given, TeachSnippet } from '@/lib/types';
import { Clamp } from './Clamp';
import { FeedbackPanel } from './FeedbackPanel';
import { QuestionStem } from './QuestionStem';
import { RichText } from './RichText';
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

function smooth(): ScrollBehavior {
  if (typeof window === 'undefined') return 'auto';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
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
  const answerRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const given = session ? session.given[session.index] : null;
  const result = session ? session.results[session.index] : null;
  const answered = result !== null && result !== undefined && (result.correct !== null || given?.kind !== 'open');
  const revealed = q?.kind === 'open' && given?.kind === 'open' && !given.selfMark;
  const locked = answered || revealed;

  const buildGiven = useCallback((): Given | null => {
    if (!q) return null;
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
  }, [q, mc, num, fill, tf, open]);

  const check = useCallback(() => {
    const g = buildGiven();
    if (g) void submitAnswer(g);
  }, [buildGiven]);

  // a fresh question: clear the inputs, load its refresher, focus the answer and go back to the top
  useEffect(() => {
    setMc(null);
    setNum('');
    setFill([]);
    setTf(null);
    setOpen('');
    if (!q) return;
    // a practice-test question is filed under the heading it follows, not the topic it tests
    void loadTeach(refresherSectionFor({ ...q, options: q.kind === 'mc' ? q.options : undefined })).then(setTeach);
    // preventScroll matters: without it, focusing an input below a long scenario
    // jumps the viewport past the question on a small screen
    answerRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: smooth() });
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (answered) feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: smooth() });
  }, [answered]);

  useEffect(() => {
    if (session && session.index >= session.test.questions.length && !finished) {
      setFinished(true);
      void finishSession();
    }
  }, [session, finished]);

  // keyboard: Enter checks, Enter again advances, letters pick an option
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      // a focused radio or button is not "typing": the letter shortcuts must still work there
      const inputType = el instanceof HTMLInputElement ? el.type : '';
      const typing =
        el?.tagName === 'TEXTAREA' ||
        Boolean(el?.isContentEditable) ||
        (el?.tagName === 'INPUT' && !['radio', 'checkbox', 'button', 'submit'].includes(inputType));
      if (e.key === 'Enter') {
        // let a textarea keep its newlines unless Ctrl+Enter is used
        if (el?.tagName === 'TEXTAREA' && !e.ctrlKey) return;
        e.preventDefault();
        if (!locked) check();
        else if (answered) nextQuestion();
        return;
      }
      if (typing || !q || locked) return;
      if (q.kind === 'mc') {
        const i = /^[a-f]$/i.test(e.key) ? e.key.toLowerCase().charCodeAt(0) - 97 : /^[1-6]$/.test(e.key) ? Number(e.key) - 1 : -1;
        if (i >= 0 && i < q.options.length) {
          e.preventDefault();
          setMc(i);
        }
      } else if (q.kind === 'tf') {
        if (e.key.toLowerCase() === 't') setTf(true);
        if (e.key.toLowerCase() === 'f') setTf(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, locked, answered, check]);

  if (!session) return null;
  if (!q) return <ScoreSummary session={session} />;

  const total = session.test.questions.length;
  const previous = session.index > 0 ? session.test.questions[session.index - 1] : undefined;
  const repeatedContext = Boolean(q.context && previous?.context && previous.context === q.context);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-xs opacity-70">
          <span>
            {specLabel(session.test.spec)}
            {session.test.spec.scope !== 'section' && q.sectionId ? ` · §${q.sectionId}` : ''}
          </span>
          <span className="truncate">
            {profile ? `Question ${session.index + 1} of ${total}` : 'Not saved — pick a learner on the home page'}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={session.index + 1}
          aria-label={`question ${session.index + 1} of ${total}`}
        >
          <div className="progress-fill" style={{ width: `${((session.index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <QuestionStem stem={q.stem} context={q.context} repeatedContext={repeatedContext} stemId={`stem-${q.id}`} measureKey={q.id} />
        <div className="mt-5">
          {q.kind === 'mc' && <McInput options={q.options} value={mc} onChange={setMc} disabled={locked} inputRef={answerRef} />}
          {q.kind === 'numeric' && <NumericInput value={num} onChange={setNum} unit={q.unit} disabled={locked} inputRef={answerRef} />}
          {q.kind === 'fill' && <FillInput blanks={q.blanks} symbolSet={q.symbolSet} values={fill} onChange={setFill} disabled={locked} inputRef={answerRef} />}
          {q.kind === 'tf' && <TfInput value={tf} onChange={setTf} disabled={locked} inputRef={answerRef} />}
          {q.kind === 'open' && <OpenInput value={open} onChange={setOpen} disabled={locked} inputRef={answerRef} />}
        </div>
        {!locked && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={check} className="w-full rounded bg-[var(--accent)] px-4 py-2.5 text-sm text-white sm:w-auto">
              {q.kind === 'open' ? 'Show model answer' : 'Check answer'}
            </button>
            <p className="key-hint hidden sm:block">
              {q.kind === 'mc'
                ? 'Press a–d to choose, Enter to check'
                : q.kind === 'tf'
                  ? 'Press t or f, Enter to check'
                  : q.kind === 'open'
                    ? 'Press Enter to see the model answer'
                    : 'Press Enter to check'}
            </p>
          </div>
        )}
      </div>

      {revealed && (
        <div className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm">
          <p className="font-semibold">Model answer</p>
          <div className="mt-1 rounded bg-[var(--accent-soft)]/50 p-3">
            <Clamp maxPx={320} measureKey={q.id} openLabel="Show the whole answer">
              <RichText text={q.modelSolution} />
            </Clamp>
          </div>
          <p className="mt-3">Compare it with your own working. Did you get it?</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button onClick={() => void submitAnswer({ kind: 'open', text: open, selfMark: 'got' })} className="rounded bg-[var(--ok)] px-4 py-2.5 text-white">
              I got it
            </button>
            <button onClick={() => void submitAnswer({ kind: 'open', text: open, selfMark: 'missed' })} className="rounded bg-[var(--bad)] px-4 py-2.5 text-white">
              I missed it
            </button>
          </div>
        </div>
      )}

      {answered && given && result && (
        <div ref={feedbackRef} className="space-y-4">
          <FeedbackPanel q={q} given={given} result={result} teach={teach} />
          <div className="flex justify-end">
            <button onClick={nextQuestion} className="w-full rounded bg-[var(--accent)] px-4 py-2.5 text-sm text-white sm:w-auto">
              {session.index + 1 < total ? 'Next question' : 'Finish'}
            </button>
          </div>
        </div>
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
