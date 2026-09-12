'use client';

import Link from 'next/link';
import { specToQuery } from '@/lib/actions';
import { useStats } from '@/lib/store';
import { ChapterGrid } from './ChapterGrid';
import { ProfilePicker } from './ProfilePicker';

/** OpenStax ships two whole-book final exams; they belong here rather than under any one chapter. */
const FINAL_EXAMS = [1, 2];

export function Home() {
  const profile = useStats((s) => s.profile);
  const open = profile?.openConcepts.length ?? 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Introductory Statistics, section by section</h1>
        <p className="mt-1 max-w-2xl text-sm opacity-70">
          Pick a section, take a quiz, learn from each mistake, and review until you understand. Print a paper test for any section or
          chapter, and generate a fresh one whenever you like.
        </p>
      </div>
      {!profile ? (
        <ProfilePicker />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm">
          <span>
            Learning as <strong>{profile.name}</strong>
          </span>
          {open > 0 ? (
            <Link href="/review" className="rounded bg-[var(--warn-soft)] px-3 py-1 text-[var(--warn)]">
              {open} concept{open === 1 ? '' : 's'} to review
            </Link>
          ) : (
            <span className="rounded bg-[var(--ok-soft)] px-3 py-1 text-[var(--ok)]">no open mistakes</span>
          )}
          <Link href="/progress" className="underline opacity-70">
            progress
          </Link>
        </div>
      )}
      <ChapterGrid />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="opacity-60">Whole-book paper tests:</span>
        {FINAL_EXAMS.map((n) => (
          <Link
            key={n}
            href={`/print?${specToQuery({ scope: 'final', id: String(n), count: 100, seed: 1 })}`}
            className="rounded border border-[var(--line)] bg-white px-3 py-1"
          >
            Print OpenStax Final Exam {n}
          </Link>
        ))}
      </div>
    </div>
  );
}
