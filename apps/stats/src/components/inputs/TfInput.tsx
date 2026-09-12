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
          disabled={disabled}
          onClick={() => onChange(v)}
          ref={i === 0 ? (inputRef as RefObject<HTMLButtonElement | null> | undefined) : undefined}
          className={`flex-1 rounded border px-4 py-2.5 text-sm sm:flex-none ${
            value === v ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white'
          }`}
        >
          {v ? 'True' : 'False'}
        </button>
      ))}
    </div>
  );
}
