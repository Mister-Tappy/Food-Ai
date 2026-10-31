interface Props<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

export default function FilterChips<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="mb-5" role="group" aria-label={label}>
      <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={opt === value}
            onClick={() => onChange(opt)}
            className={`chip ${opt === value ? "chip-active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
