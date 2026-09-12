'use client';

import Link from 'next/link';
import { useStats } from '@/lib/store';
import { MasteryBadge } from './MasteryBadge';

export function ChapterGrid() {
  const { catalog, profile } = useStats();
  if (catalog.length === 0) return <p className="text-sm opacity-60">Loading chapters…</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {catalog.map((c) => {
        const mastered = c.sections.filter((s) => profile?.mastery[s.id] === 'mastered').length;
        return (
          // min-w-0: a grid item defaults to min-width:auto and sizes itself to its longest title,
          // which at phone width pushed every card to 600px and the page sideways
          <section key={c.number} className="min-w-0 rounded-lg border border-[var(--line)] bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="min-w-0 font-semibold">
                <Link href={`/chapter/${c.number}`} className="hover:underline">
                  {c.number}. {c.title}
                </Link>
              </h3>
              <span className="shrink-0 text-xs opacity-60">
                {mastered}/{c.sections.length} mastered
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {c.sections.map((s) => (
                <li key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                  <Link href={`/section/${s.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {s.id} {s.title}
                  </Link>
                  <MasteryBadge mastery={profile?.mastery[s.id] ?? 'not_started'} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
