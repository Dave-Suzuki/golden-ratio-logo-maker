'use client';

import Link from 'next/link';
import { specToQuery, startQuiz } from '@/lib/actions';
import { specLabel, useStats, type Session } from '@/lib/store';

export function ScoreSummary({ session }: { session: Session }) {
  const total = session.test.questions.length;
  const correct = session.results.filter((r) => r?.correct === true).length;
  const missed = session.test.questions.filter((_, i) => session.results[i]?.correct === false);
  const spec = session.test.spec;
  const stillOpen = useStats((s) => s.profile?.openConcepts.length ?? 0);
  // group the misses by section for display; the review loop itself tracks each question
  const bySection = new Map<string, number>();
  for (const q of missed) bySection.set(q.sectionId ?? '?', (bySection.get(q.sectionId ?? '?') ?? 0) + 1);
  const inReview = spec.scope === 'review';
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h2 className="text-xl font-semibold">
          {specLabel(spec)}: {correct} / {total} correct ({total ? Math.round((100 * correct) / total) : 0}%)
        </h2>
        {inReview ? (
          <p className="mt-2 text-sm">
            {stillOpen > 0
              ? `${stillOpen} question${stillOpen === 1 ? '' : 's'} still to get right twice in a row.`
              : 'Everything you had missed is now understood.'}
          </p>
        ) : missed.length > 0 ? (
          <div className="mt-3 text-sm">
            <p className="font-medium">Missed this time:</p>
            <ul className="mt-1 list-disc pl-5">
              {[...bySection.entries()].map(([sid, n]) => (
                <li key={sid}>
                  §{sid} — {n} missed
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--ok)]">No mistakes. Sections count as mastered at 80% or better with no open concepts.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {(inReview ? stillOpen > 0 : missed.length > 0) && (
          <Link href="/review" className="rounded bg-[var(--accent)] px-4 py-2 text-white">
            {inReview ? 'Keep reviewing' : 'Review mistakes'}
          </Link>
        )}
        {spec.scope !== 'review' && (
          <>
            <button onClick={() => void startQuiz({ ...spec, seed: Math.floor(Math.random() * 1_000_000) })} className="rounded border border-[var(--line)] bg-white px-4 py-2">
              Retake with new questions
            </button>
            <Link href={`/print?${specToQuery(spec)}`} className="rounded border border-[var(--line)] bg-white px-4 py-2">
              Print this test
            </Link>
          </>
        )}
        <Link href="/" className="rounded border border-[var(--line)] bg-white px-4 py-2">
          Back to chapters
        </Link>
      </div>
    </div>
  );
}
