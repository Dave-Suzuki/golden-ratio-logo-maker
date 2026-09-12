import type { RefObject } from 'react';

type AnswerRef = RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;

export function McInput({
  options,
  value,
  onChange,
  disabled,
  inputRef,
}: {
  options: string[];
  value: number | null;
  onChange: (i: number) => void;
  disabled?: boolean;
  inputRef?: AnswerRef;
}) {
  return (
    <ul className="space-y-1.5">
      {options.map((o, i) => (
        <li key={i}>
          <label
            className={`flex cursor-pointer items-start gap-2.5 rounded border px-3 py-2.5 text-sm ${
              value === i ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white'
            }`}
          >
            <input
              type="radio"
              name="mc"
              checked={value === i}
              onChange={() => onChange(i)}
              disabled={disabled}
              className="mt-1"
              ref={i === 0 ? (inputRef as RefObject<HTMLInputElement | null> | undefined) : undefined}
            />
            <span className="mc-key mt-px">{String.fromCharCode(97 + i)}.</span>
            <span className="line-clamp-4" title={o}>
              {o}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
