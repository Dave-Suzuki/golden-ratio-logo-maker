import type { RefObject } from 'react';

type AnswerRef = RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;

export function OpenInput({
  value,
  onChange,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  inputRef?: AnswerRef;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={5}
      placeholder="Work it out here, then compare with the model answer."
      className="w-full rounded border border-[var(--line)] px-3 py-2.5 text-sm"
      ref={inputRef as RefObject<HTMLTextAreaElement | null> | undefined}
    />
  );
}
