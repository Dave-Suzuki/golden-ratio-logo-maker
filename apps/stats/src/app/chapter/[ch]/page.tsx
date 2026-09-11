import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterActions } from '@/components/ChapterActions';
import { SectionMastery } from '@/components/SectionMastery';
import { bankFor, chapterOf, testItems } from '@/lib/server/content';
import { templatesFor } from '../../../../content/templates';

const PRACTICE_TEST_FOR_CHAPTER: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3, 11: 3, 12: 4, 13: 4 };

export default async function ChapterPage({ params }: { params: Promise<{ ch: string }> }) {
  const { ch } = await params;
  const chapter = chapterOf(Number(ch));
  if (!chapter) notFound();
  const pt = PRACTICE_TEST_FOR_CHAPTER[chapter.number];
  const ptCount = pt ? testItems('pt', pt).length : 0;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide opacity-60">Chapter {chapter.number}</p>
        <h1 className="text-2xl font-semibold">{chapter.title}</h1>
      </div>
      <ChapterActions chapter={chapter.number} practiceTest={pt ?? null} practiceTestCount={ptCount} />
      <ul className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white">
        {chapter.sections.map((s) => {
          const items = bankFor(s.id);
          const auto = items.filter((q) => q.kind !== 'open').length;
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <Link href={`/section/${s.id}`} className="font-medium hover:underline">
                {s.id} {s.title}
              </Link>
              <span className="text-xs opacity-60">
                {items.length} items · {auto} auto-graded · {templatesFor(s.id).length} generators
              </span>
              <span className="ml-auto">
                <SectionMastery sectionId={s.id} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
