'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { specToQuery } from '@/lib/actions';
import type { TestSpec } from '@/lib/types';

export function SectionActions({
  sectionId,
  hasTemplates,
  autoGraded = 1,
}: {
  sectionId: string;
  hasTemplates: boolean;
  /** how many questions here can be marked without a model answer */
  autoGraded?: number;
}) {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [openShare, setOpenShare] = useState(0.3);
  // §1.4 is entirely worked problems: asking for none of them would build an empty test, and the
  // learner would meet "no questions available for this scope" with nothing to explain it
  const noneIsEmpty = autoGraded === 0 && !hasTemplates;
  const spec = (): TestSpec => ({ scope: 'section', id: sectionId, count, seed: Math.floor(Math.random() * 1_000_000), openShare, templateShare: hasTemplates ? 0.4 : 0 });
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1">
        <span className="opacity-60">questions</span>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded border border-[var(--line)] bg-white px-2 py-1">
          {[5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        <span className="opacity-60">worked problems</span>
        <select value={openShare} onChange={(e) => setOpenShare(Number(e.target.value))} className="rounded border border-[var(--line)] bg-white px-2 py-1">
          <option value={0} disabled={noneIsEmpty}>
            none
          </option>
          <option value={0.3}>some</option>
          <option value={0.6}>mostly</option>
          <option value={1}>only</option>
        </select>
      </label>
      {noneIsEmpty && <span className="text-xs opacity-60">every question here is a worked problem</span>}
      <button onClick={() => router.push(`/quiz?${specToQuery(spec())}`)} className="rounded bg-[var(--accent)] px-4 py-2 text-white">
        Start quiz
      </button>
      <button onClick={() => router.push(`/print?${specToQuery(spec())}`)} className="rounded border border-[var(--line)] bg-white px-4 py-2">
        Print a test
      </button>
    </div>
  );
}
