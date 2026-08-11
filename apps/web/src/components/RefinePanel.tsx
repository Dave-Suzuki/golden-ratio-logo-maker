'use client';

import { useState } from 'react';
import { LIMITS } from '@kiwari/engine';
import { applyLocalDelta, applyNlEdit, replanSelected } from '@/lib/actions';
import { useStudio } from '@/lib/store';

const btn =
  'rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-30 transition-colors';

export function RefinePanel() {
  const { workingPlan, brief, refineMessage, editing, history } = useStudio();
  const [instruction, setInstruction] = useState('');
  if (!workingPlan || !brief) return null;

  const hasStroke = workingPlan.style.strokeStep !== null;
  const hasCounterform = workingPlan.composite.some((c) => c.op === 'subtract');
  const hasCorrections = workingPlan.optical.corrections.length > 0;

  const sendNl = () => {
    if (instruction.trim().length === 0 || editing) return;
    void applyNlEdit(instruction.trim());
    setInstruction('');
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide opacity-60">Say it</p>
        <div className="flex gap-2">
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendNl();
            }}
            placeholder='“make it heavier” · “rotate left” · “more open” · “less literal”'
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button onClick={sendNl} disabled={editing || instruction.trim().length === 0} className={btn}>
            {editing ? '…' : 'Apply'}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide opacity-60">Tune it — constraints hold</p>
        <div className="flex flex-wrap gap-2">
          {hasStroke && (
            <span className="inline-flex items-center gap-1">
              <span className="text-xs opacity-60">weight</span>
              <button
                className={btn}
                disabled={workingPlan.style.strokeStep! <= LIMITS.strokeStepMin}
                onClick={() => applyLocalDelta({ op: 'weight', direction: -1 }, 'lighter')}
              >
                −φ
              </button>
              <button
                className={btn}
                disabled={workingPlan.style.strokeStep! >= LIMITS.strokeStepMax}
                onClick={() => applyLocalDelta({ op: 'weight', direction: 1 }, 'heavier')}
              >
                +φ
              </button>
            </span>
          )}
          {hasCounterform && (
            <span className="inline-flex items-center gap-1">
              <span className="text-xs opacity-60">counterform</span>
              <button className={btn} onClick={() => applyLocalDelta({ op: 'counterform', direction: -1 }, 'tighter')}>
                tighter
              </button>
              <button className={btn} onClick={() => applyLocalDelta({ op: 'counterform', direction: 1 }, 'more open')}>
                open
              </button>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="text-xs opacity-60">rotate</span>
            {([-90, 90, 137.5] as const).map((angle) => (
              <button key={angle} className={btn} onClick={() => applyLocalDelta({ op: 'rotate', angle }, `rotate ${angle}°`)}>
                {angle > 0 ? '+' : ''}
                {angle}°
              </button>
            ))}
          </span>
          <button className={btn} onClick={() => applyLocalDelta({ op: 'mirror', axis: 'vertical' }, 'mirror')}>
            mirror
          </button>
          <span className="inline-flex items-center gap-1">
            <span className="text-xs opacity-60">abstraction</span>
            <button
              className={btn}
              onClick={() =>
                void replanSelected(
                  { ...brief, motif: { ...brief.motif, abstraction: Math.max(0, brief.motif.abstraction - 0.25) } },
                  'more literal',
                  true,
                )
              }
            >
              more literal
            </button>
            <button
              className={btn}
              onClick={() =>
                void replanSelected(
                  { ...brief, motif: { ...brief.motif, abstraction: Math.min(1, brief.motif.abstraction + 0.25) } },
                  'more abstract',
                  true,
                )
              }
            >
              more abstract
            </button>
          </span>
          {hasCorrections && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={workingPlan.optical.enabled}
                onChange={(e) => applyLocalDelta({ op: 'optical', enabled: e.target.checked }, 'optical toggle')}
              />
              <span className="text-xs">
                optical corrections{' '}
                <span className="opacity-50">(labeled deviations from the math)</span>
              </span>
            </label>
          )}
          {history.length > 0 && (
            <button className={btn} onClick={() => useStudio.getState().undo()}>
              ↩ undo
            </button>
          )}
        </div>
      </div>

      {refineMessage && (
        <p className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-2 text-sm">
          {refineMessage}
        </p>
      )}
    </div>
  );
}
