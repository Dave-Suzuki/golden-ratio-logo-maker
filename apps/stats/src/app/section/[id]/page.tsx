import { notFound } from 'next/navigation';
import { SectionActions } from '@/components/SectionActions';
import { SectionMastery } from '@/components/SectionMastery';
import { TeachPanel } from '@/components/TeachPanel';
import { bankFor, sectionById, teachFor } from '@/lib/server/content';
import { templatesFor } from '../../../../content/templates';

export default async function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = sectionById(id);
  if (!section) notFound();
  const teach = teachFor(id);
  const items = bankFor(id);
  const kinds = { mc: 0, numeric: 0, fill: 0, tf: 0, open: 0 };
  for (const q of items) kinds[q.kind]++;
  const generators = templatesFor(id).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-60">Section {section.id}</p>
          <h1 className="text-2xl font-semibold">{section.title}</h1>
          <p className="mt-1 text-xs opacity-60">
            {items.length} items ({kinds.mc} multiple choice · {kinds.numeric} numeric · {kinds.tf} true/false · {kinds.fill} fill-in · {kinds.open} worked problems) · {generators} generators
          </p>
        </div>
        <SectionMastery sectionId={id} />
      </div>
      <SectionActions sectionId={id} hasTemplates={generators > 0} />
      {teach ? (
        <details open className="rounded-lg border border-[var(--line)] bg-white p-5">
          <summary className="cursor-pointer font-semibold">Refresh the essentials</summary>
          <div className="mt-3">
            <TeachPanel teach={teach} mode="refresh" />
          </div>
        </details>
      ) : null}
    </div>
  );
}
