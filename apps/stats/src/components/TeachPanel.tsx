import { relevantTo } from '@/lib/refresher';
import type { TeachSnippet } from '@/lib/types';

/**
 * The refresher: essentials only. `mode="miss"` (after a wrong answer) leads with the pitfalls;
 * `mode="refresh"` (before a quiz) leads with the key points. Never the full notes — the learner has the textbook.
 */
export function TeachPanel({ teach, mode = 'refresh', focus }: { teach: TeachSnippet; mode?: 'refresh' | 'miss'; focus?: string }) {
  // after a miss, lead with the warnings that bear on the question actually asked
  const pitfalls = focus ? relevantTo(focus, teach.pitfalls).slice(0, 3) : teach.pitfalls;
  const pitfallList = pitfalls.length > 0 && (
    <section key="pitfalls">
      <h4 className="eyebrow">Watch out for</h4>
      <ul className="mt-1 space-y-1">
        {pitfalls.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-[var(--warn)]">
              ⚠
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
  const points = (
    <section key="points">
      <h4 className="eyebrow">Key points</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {teach.keyPoints.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </section>
  );
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {mode === 'miss' ? [pitfallList, points] : [points, pitfallList]}
      {teach.formulas.length > 0 && (
        <section>
          <h4 className="eyebrow">Formulas</h4>
          <ul className="mt-1 space-y-1 font-mono text-[13px]">
            {teach.formulas.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}
      {teach.terms.length > 0 && (
        <section>
          <h4 className="eyebrow">Terms</h4>
          <dl className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {teach.terms.map(([term, meaning]) => (
              <div key={term} className="flex gap-2">
                <dt className="shrink-0 font-medium">{term}</dt>
                <dd className="opacity-80">{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <p className="text-xs opacity-60">Read more: {teach.textbookRef}.</p>
    </div>
  );
}
