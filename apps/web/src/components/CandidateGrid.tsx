'use client';

import { useStudio } from '@/lib/store';
import { MarkSvg } from './MarkSvg';
import { SourceBadge } from './BriefChips';

const FAMILY_LABEL: Record<string, string> = {
  phi_circle_chain: 'φ circle chain',
  golden_rect_subdivision: 'golden subdivision',
  pentagonal: 'pentagonal',
  root2_grid: '√2 grid',
};

export function CandidateGrid() {
  const { plans, planSource, selected, seed } = useStudio();
  if (plans.length === 0) return null;

  return (
    <section className="mx-auto mt-8 max-w-3xl">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide opacity-60">
          Nine constructions · seed {seed} — same brief &amp; seed always rebuilds these exact marks
        </p>
        <SourceBadge source={planSource} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {plans.map((plan, i) => (
          <button
            key={i}
            onClick={() => useStudio.getState().select(i)}
            className={`group rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
              selected === i ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-[var(--line)]'
            }`}
          >
            <MarkSvg plan={plan} className="aspect-square w-full" />
            <p className="mt-2 text-[10px] uppercase tracking-wide opacity-40 group-hover:opacity-70">
              {FAMILY_LABEL[plan.family]}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
