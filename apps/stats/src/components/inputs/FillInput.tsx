import { HYPOTHESIS_SYMBOLS } from '@/lib/format';
import type { FillBlank } from '@/lib/types';

export function FillInput({ blanks, symbolSet, values, onChange, disabled }: { blanks: FillBlank[]; symbolSet?: 'hypothesis' | 'notation'; values: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const set = (i: number, v: string) => onChange(blanks.map((_, j) => (j === i ? v : (values[j] ?? ''))));
  return (
    <div className="space-y-2 text-sm">
      {blanks.map((b, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <span className="w-24 font-mono">{b.label}</span>
          {symbolSet === 'hypothesis' ? (
            <span className="flex gap-1">
              {HYPOTHESIS_SYMBOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => set(i, s)}
                  className={`h-9 w-9 rounded border text-base ${values[i] === s ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white'}`}
                >
                  {s}
                </button>
              ))}
            </span>
          ) : null}
          <input
            value={values[i] ?? ''}
            onChange={(e) => set(i, e.target.value)}
            disabled={disabled}
            placeholder={symbolSet === 'hypothesis' ? 'or type >=, <, !=' : 'answer'}
            className="w-40 rounded border border-[var(--line)] px-2 py-1.5 font-mono"
          />
        </div>
      ))}
    </div>
  );
}
