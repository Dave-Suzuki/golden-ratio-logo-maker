'use client';

import type { RenderResult } from '@kiwari/engine';
import type { RevealLayers } from '@/lib/store';

/**
 * The construction reveal (EXP-1/EXP-3): lattice lines, guide rects, guide
 * circles, spiral, anchors, and labeled ratios as sibling SVG layers over the
 * dimmed mark. Lines draw themselves in via stroke-dashoffset, staggered by
 * subdivision level — the construction literally rebuilds itself.
 */
export function RevealOverlay({ result, layers }: { result: RenderResult; layers: RevealLayers }) {
  const c = result.construction;
  const accent = '#b8860b';
  const ink = '#1c1a17';
  return (
    <g className="kiwari-reveal">
      {layers.rects &&
        c.guideRects.map((r, i) => (
          <rect
            key={`r${i}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="none"
            stroke={ink}
            strokeWidth={1.2}
            opacity={0.5}
            className="reveal-draw"
            style={{ animationDelay: `${r.level * 0.28}s` }}
          />
        ))}
      {layers.grid &&
        c.latticeLines.map((l, i) => (
          <line
            key={`l${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={ink}
            strokeWidth={0.8}
            opacity={0.35}
            className="reveal-draw"
            style={{ animationDelay: `${l.level * 0.28}s` }}
          />
        ))}
      {layers.spiral && c.spiralPath && (
        <path
          d={c.spiralPath}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          className="reveal-draw"
          style={{ animationDelay: '0.5s' }}
        />
      )}
      {layers.circles &&
        c.guideCircles.map((gc, i) => (
          <g key={`c${i}`}>
            <circle
              cx={gc.cx}
              cy={gc.cy}
              r={gc.r}
              fill="none"
              stroke={accent}
              strokeWidth={1.5}
              strokeDasharray="6 5"
              opacity={0.9}
              className="reveal-fade"
              style={{ animationDelay: `${0.6 + i * 0.2}s` }}
            />
            {layers.labels && (
              <text
                x={gc.cx}
                y={gc.cy - gc.r - 8}
                textAnchor="middle"
                fontSize={26}
                fill={accent}
                className="reveal-fade"
                style={{ animationDelay: `${0.9 + i * 0.2}s`, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {gc.label}
              </text>
            )}
          </g>
        ))}
      {layers.anchors &&
        c.anchors.map((a) => (
          <g key={a.id} className="reveal-fade" style={{ animationDelay: '1.1s' }}>
            <circle cx={a.x} cy={a.y} r={7} fill={accent} />
            <circle cx={a.x} cy={a.y} r={13} fill="none" stroke={accent} strokeWidth={1.4} />
            {layers.labels && (
              <text x={a.x + 18} y={a.y + 5} fontSize={22} fill={ink} opacity={0.75} style={{ fontFamily: 'ui-monospace, monospace' }}>
                {a.id}
              </text>
            )}
          </g>
        ))}
      {layers.labels &&
        c.labels.map((l, i) => (
          <text
            key={`t${i}`}
            x={l.x}
            y={l.y}
            textAnchor="end"
            fontSize={28}
            fill={ink}
            opacity={0.8}
            className="reveal-fade"
            style={{ animationDelay: '1.3s', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {l.text}
          </text>
        ))}
    </g>
  );
}
