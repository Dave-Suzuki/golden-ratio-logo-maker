'use client';

import { useStats } from '@/lib/store';
import { MasteryBadge } from './MasteryBadge';

export function SectionMastery({ sectionId }: { sectionId: string }) {
  const profile = useStats((s) => s.profile);
  const st = profile?.sectionStats[sectionId];
  return (
    <span className="flex items-center gap-2 text-xs">
      {st?.lastScore !== undefined && <span className="opacity-60">last {Math.round(st.lastScore * 100)}%</span>}
      <MasteryBadge mastery={profile?.mastery[sectionId] ?? 'not_started'} />
    </span>
  );
}
