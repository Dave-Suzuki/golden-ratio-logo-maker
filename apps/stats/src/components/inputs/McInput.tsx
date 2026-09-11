export function McInput({ options, value, onChange, disabled }: { options: string[]; value: number | null; onChange: (i: number) => void; disabled?: boolean }) {
  return (
    <ul className="space-y-1">
      {options.map((o, i) => (
        <li key={i}>
          <label className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-sm ${value === i ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white'}`}>
            <input type="radio" name="mc" checked={value === i} onChange={() => onChange(i)} disabled={disabled} className="mt-1" />
            <span>
              <span className="mr-1 font-mono text-xs opacity-60">{String.fromCharCode(97 + i)}.</span>
              {o}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
