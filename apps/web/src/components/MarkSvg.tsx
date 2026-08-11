'use client';

import { useMemo } from 'react';
import { fitViewBox, renderPlan, type ConstructionPlan, type RenderResult } from '@kiwari/engine';

export function useRender(plan: ConstructionPlan | null): RenderResult | null {
  return useMemo(() => (plan ? renderPlan(plan) : null), [plan]);
}

export function MarkPathsSvg({
  result,
  color = '#1c1a17',
  dimmed = false,
}: {
  result: RenderResult;
  color?: string;
  dimmed?: boolean;
}) {
  return (
    <g opacity={dimmed ? 0.15 : 1}>
      {result.mark.paths.map((p, i) =>
        p.role === 'fill' ? (
          <path key={i} d={p.d} fill={color} fillRule="nonzero" />
        ) : (
          <path key={i} d={p.d} fill="none" stroke={color} strokeWidth={p.strokeWidth} strokeLinecap="round" />
        ),
      )}
    </g>
  );
}

/** A mark rendered standalone with a fitted viewBox (grid thumbnails, checks). */
export function MarkSvg({
  plan,
  color = '#1c1a17',
  background,
  className,
  title,
}: {
  plan: ConstructionPlan;
  color?: string;
  background?: string;
  className?: string;
  title?: string;
}) {
  const result = useRender(plan);
  if (!result) return null;
  const vb = fitViewBox(result.mark.bounds);
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className={className}
      role="img"
      aria-label={title ?? 'constructed mark'}
      style={background ? { background } : undefined}
    >
      <MarkPathsSvg result={result} color={color} />
    </svg>
  );
}
