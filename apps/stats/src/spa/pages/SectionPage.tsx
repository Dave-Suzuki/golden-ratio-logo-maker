import { SectionActions } from '@/components/SectionActions';
import { SectionMastery } from '@/components/SectionMastery';
import { TeachPanel } from '@/components/TeachPanel';
import { bankFor, sectionById, teachFor } from '@/lib/server/content';
import { templatesFor } from '../../../content/templates';

export function SectionPage({ id }: { id: string }) {
  const section = sectionById(id);
  if (!section) return <p className="text-sm">Unknown section.</p>;
  const teach = teachFor(id);
  const items = bankFor(id);
  const kinds = { mc: 0, numeric: 0, fill: 0, tf: 0, open: 0 };
  for (const q of items) kinds[q.kind]++;
  const auto = items.length - kinds.open;
  const generators = templatesFor(id).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Section {section.id}</p>
          <h1 className="display text-2xl">{section.title}</h1>
          <p className="mt-1 text-xs opacity-60">
            {items.length} questions ready · {auto} checked instantly · {kinds.open} worked problems with model answers
            {generators > 0 ? ' · fresh numbers every time you retake it' : ''}
          </p>
        </div>
        <SectionMastery sectionId={id} />
      </div>
      <SectionActions sectionId={id} hasTemplates={generators > 0} />
      {teach ? (
        <details open className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <summary className="cursor-pointer font-semibold">Refresh the essentials</summary>
          <div className="mt-3">
            <TeachPanel teach={teach} mode="refresh" />
          </div>
        </details>
      ) : null}
    </div>
  );
}
