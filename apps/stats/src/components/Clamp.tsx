'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Collapses over-long content behind a "Show all" toggle.
 *
 * The first paint uses the caller's own estimate so the server and client markup agree, then a
 * layout effect measures the real box and removes the toggle when the content turned out to fit.
 */
// useLayoutEffect warns during server rendering; the effect only matters once there is a DOM
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Clamp({
  children,
  maxPx = 208,
  probablyLong = false,
  openLabel = 'Show all',
  closeLabel = 'Show less',
  startOpen = false,
  measureKey,
}: {
  children: ReactNode;
  maxPx?: number;
  /** the caller's cheap guess, used for the very first paint */
  probablyLong?: boolean;
  openLabel?: string;
  closeLabel?: string;
  startOpen?: boolean;
  /** re-measure when this changes (e.g. the question id) */
  measureKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(probablyLong);
  const [open, setOpen] = useState(startOpen);

  useIsomorphicLayoutEffect(() => {
    setOpen(startOpen);
    const el = ref.current;
    if (el) setOverflowing(el.scrollHeight > maxPx + 24);
  }, [measureKey, maxPx, startOpen]);

  const collapsed = overflowing && !open;
  return (
    <div>
      <div
        ref={ref}
        className={collapsed ? 'clamp-body fade-bottom' : undefined}
        style={collapsed ? { maxHeight: maxPx, overflow: 'hidden' } : undefined}
      >
        {children}
      </div>
      {overflowing && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="clamp-toggle">
          {open ? closeLabel : openLabel}
        </button>
      )}
    </div>
  );
}
