'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { specToQuery } from '@/lib/actions';
import type { TestSpec } from '@/lib/types';

export function ChapterActions({ chapter, practiceTest, practiceTestCount }: { chapter: number; practiceTest: number | null; practiceTestCount: number }) {
  const router = useRouter();
  const [count, setCount] = useState(15);
  const spec = (): TestSpec => ({ scope: 'chapter', id: String(chapter), count, seed: Math.floor(Math.random() * 1_000_000) });
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1">
        <span className="opacity-60">questions</span>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded border border-[var(--line)] bg-white px-2 py-1">
          {[10, 15, 20, 30].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button onClick={() => router.push(`/quiz?${specToQuery(spec())}`)} className="rounded bg-[var(--accent)] px-4 py-2 text-white">
        Chapter quiz
      </button>
      <button onClick={() => router.push(`/print?${specToQuery(spec())}`)} className="rounded border border-[var(--line)] bg-white px-4 py-2">
        Print chapter test
      </button>
      {practiceTest && practiceTestCount > 0 && (
        <Link href={`/print?${specToQuery({ scope: 'practice-test', id: String(practiceTest), count: practiceTestCount, seed: 1 })}`} className="rounded border border-[var(--line)] bg-white px-4 py-2">
          Print OpenStax Practice Test {practiceTest}
        </Link>
      )}
    </div>
  );
}
