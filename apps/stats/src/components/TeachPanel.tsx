import type { TeachSnippet } from '@/lib/types';
import { RichText } from './QuestionStem';

export function TeachPanel({ teach, compact = false, tag }: { teach: TeachSnippet; compact?: boolean; tag?: string }) {
  const byTag = tag && teach.byTag?.[tag];
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {byTag && <RichText text={byTag} className="rounded bg-[var(--warn-soft)] p-3" />}
      {teach.notesText && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide opacity-60">Lecture notes{teach.notesTitle ? ` — ${teach.notesTitle}` : ''}</h4>
          <RichText text={compact ? teach.notesText.slice(0, 1600) + (teach.notesText.length > 1600 ? ' …' : '') : teach.notesText} />
        </section>
      )}
      {teach.summary && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide opacity-60">Chapter review (OpenStax)</h4>
          <RichText text={teach.summary} />
        </section>
      )}
      {teach.formulaReview && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide opacity-60">Formula review</h4>
          <RichText text={teach.formulaReview} className="font-mono text-[13px]" />
        </section>
      )}
      {teach.glossary.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide opacity-60">Key terms</h4>
          <dl className="mt-1 grid gap-1 sm:grid-cols-2">
            {teach.glossary.map((g) => (
              <div key={g.term}>
                <dt className="font-medium">{g.term}</dt>
                <dd className="opacity-80">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
