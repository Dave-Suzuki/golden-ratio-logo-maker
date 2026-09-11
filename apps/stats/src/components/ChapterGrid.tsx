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
          <section key={c.number} className="rounded-lg border border-[var(--line)] bg-white p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">
                <Link href={`/chapter/${c.number}`} className="hover:underline">
                  {c.number}. {c.title}
                </Link>
              </h3>
              <span className="text-xs opacity-60">
                {mastered}/{c.sections.length} mastered
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {c.sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <Link href={`/section/${s.id}`} className="truncate hover:underline">
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
