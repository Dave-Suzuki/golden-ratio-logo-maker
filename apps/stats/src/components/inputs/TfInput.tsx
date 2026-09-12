import type { RefObject } from 'react';

type AnswerRef = RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;

export function TfInput({
  value,
  onChange,
  disabled,
  inputRef,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  inputRef?: AnswerRef;
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v, i) => (
        <button
          key={String(v)}
          type="button"
          data-answer-control
          disabled={disabled}
          onClick={() => onChange(v)}
          ref={i === 0 ? (inputRef as RefObject<HTMLButtonElement | null> | undefined) : undefined}
          aria-pressed={value === v}
          className={`flex-1 rounded border px-4 py-2.5 text-sm sm:flex-none ${
            value === v ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-semibold' : 'border-[var(--line)] bg-white'
          }`}
        >
          {/* the tick is the selected cue; the focus ring alone looked like a choice already made */}
          {value === v ? '✓ ' : ''}
          {v ? 'True' : 'False'}
        </button>
      ))}
    </div>
  );
}
