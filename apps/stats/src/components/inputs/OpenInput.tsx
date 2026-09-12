'use client';

import { useState, type RefObject } from 'react';
import { answerOutline, outlineToText } from '@/lib/outline';

type AnswerRef = RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;

/**
 * The workspace for a worked problem.
 *
 * A question that expects eight named things ("use key terms from this module to describe the
 * design of this experiment") used to arrive as one empty box, and the learner only discovered
 * what was wanted when the model answer appeared. Where the expected answer has a visible
 * structure, the box becomes one row per thing to answer, so the learner is working on the
 * question rather than guessing its shape. See src/lib/outline.ts for what is offered and why it
 * gives nothing away.
 */
export function OpenInput({
  value,
  onChange,
  disabled,
  inputRef,
  stem,
  modelSolution,
  questionId,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  inputRef?: AnswerRef;
  stem?: string;
  modelSolution?: string;
  questionId?: string;
}) {
  const outline = stem && modelSolution ? answerOutline(stem, modelSolution) : null;
  const [rowValues, setRowValues] = useState<string[]>([]);
  const [freeform, setFreeform] = useState(false);

  if (!outline || freeform) {
    return (
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder="Work it out here, then compare with the model answer."
          className="w-full rounded border border-[var(--line)] px-3 py-2.5 text-sm"
          ref={inputRef as RefObject<HTMLTextAreaElement | null> | undefined}
        />
        {outline && !disabled && (
          <button type="button" onClick={() => setFreeform(false)} className="clamp-toggle">
            Answer point by point instead
          </button>
        )}
      </div>
    );
  }

  const set = (i: number, v: string) => {
    const next = outline.map((_, j) => (j === i ? v : (rowValues[j] ?? '')));
    setRowValues(next);
    onChange(outlineToText(outline, next));
  };

  return (
    <div key={questionId}>
      <p className="mb-2 text-xs opacity-70">This one wants {outline.length} things. Answer what you can — a blank row just counts as missed.</p>
      <ul className="space-y-1.5">
        {outline.map((row, i) => (
          <li key={row.label} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-sm font-medium sm:w-48 sm:text-right">
              {row.label}
              {row.hint && <span className="ml-1 font-normal opacity-60">{row.hint}</span>}
            </span>
            <input
              value={rowValues[i] ?? ''}
              onChange={(e) => set(i, e.target.value)}
              disabled={disabled}
              className="w-full rounded border border-[var(--line)] px-3 py-2 text-sm"
              ref={i === 0 ? (inputRef as RefObject<HTMLInputElement | null> | undefined) : undefined}
            />
          </li>
        ))}
      </ul>
      {!disabled && (
        <button type="button" onClick={() => setFreeform(true)} className="clamp-toggle">
          Write it as one answer instead
        </button>
      )}
    </div>
  );
}
