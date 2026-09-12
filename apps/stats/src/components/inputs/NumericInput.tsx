import type { RefObject } from 'react';

type AnswerRef = RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;

export function NumericInput({
  value,
  onChange,
  unit,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  unit?: string | null;
  disabled?: boolean;
  inputRef?: AnswerRef;
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        inputMode="decimal"
        placeholder="e.g. 0.1587, -1.5, 3/8, 35%"
        className="w-full rounded border border-[var(--line)] px-3 py-2.5 font-mono sm:w-64"
        ref={inputRef as RefObject<HTMLInputElement | null> | undefined}
      />
      {unit && <span className="opacity-60">{unit}</span>}
    </label>
  );
}
