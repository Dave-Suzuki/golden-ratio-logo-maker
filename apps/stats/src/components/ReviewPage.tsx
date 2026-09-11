'use client';

import Link from 'next/link';
import { startReview } from '@/lib/actions';
import { useStats } from '@/lib/store';
import { QuizRunner } from './QuizRunner';

export function ReviewPage() {
  const { profile, session, busy, error } = useStats();
  if (!profile)
    return (
      <p className="text-sm">
        <Link href="/" className="underline">
          Choose a learner
        </Link>{' '}
        first.
      </p>
    );
  const open = profile.openConcepts;
  const active = session?.mode === 'review' && session.index < session.test.questions.length;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Review mistakes</h1>
        <p className="mt-1 text-sm opacity-70">
          Every concept you missed stays open until you answer it correctly twice in a row. Reviews use fresh numbers where a generator exists,
          otherwise a different problem on the same concept, and finally the problem you missed.
        </p>
      </div>
      {open.length === 0 && !active ? (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--ok-soft)] p-4 text-sm text-[var(--ok)]">Nothing to review. Take a quiz to find gaps.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 text-sm">
          {open.map((c) => (
            <li key={c.conceptTag} className="rounded border border-[var(--line)] bg-white px-3 py-1">
              §{c.conceptTag}{' '}
              <span className="font-mono">
                {Array.from({ length: c.required }, (_, i) => (i < c.streak ? '●' : '○')).join('')}
              </span>
              <span className="ml-1 opacity-50">missed {c.misses}×</span>
            </li>
          ))}
        </ul>
      )}
      {!active && open.length > 0 && (
        <button onClick={() => void startReview(Math.min(12, Math.max(4, open.length * 2)))} disabled={!!busy} className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50">
          {busy === 'review' ? 'Building…' : 'Start review'}
        </button>
      )}
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {session?.mode === 'review' && <QuizRunner />}
    </div>
  );
}
