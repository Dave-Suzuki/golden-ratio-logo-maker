import type { Mastery } from '@/lib/types';

const STYLE: Record<Mastery, { label: string; cls: string }> = {
  not_started: { label: 'not started', cls: 'bg-neutral-100 text-neutral-500' },
  in_progress: { label: 'in progress', cls: 'bg-[var(--warn-soft)] text-[var(--warn)]' },
  mastered: { label: 'mastered', cls: 'bg-[var(--ok-soft)] text-[var(--ok)]' },
};

export function MasteryBadge({ mastery }: { mastery: Mastery }) {
  const s = STYLE[mastery];
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>;
}
