export function OpenInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={4}
      placeholder="Work it out here, then compare with the model solution."
      className="w-full rounded border border-[var(--line)] px-3 py-2 text-sm"
    />
  );
}
