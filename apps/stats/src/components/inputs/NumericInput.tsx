export function NumericInput({ value, onChange, unit, disabled }: { value: string; onChange: (v: string) => void; unit?: string | null; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        inputMode="decimal"
        placeholder="e.g. 0.1587, -1.5, 3/8, 35%"
        className="w-56 rounded border border-[var(--line)] px-3 py-2 font-mono"
      />
      {unit && <span className="opacity-60">{unit}</span>}
    </label>
  );
}
