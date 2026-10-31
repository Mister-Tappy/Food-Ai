interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <div className="flex items-center gap-2 bg-bg border border-slate-200 rounded-lg px-4 py-2 w-full max-w-md">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-muted shrink-0">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <label htmlFor="search-input" className="sr-only">
        Search restaurants
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search restaurants or dishes..."}
        className="flex-1 bg-transparent outline-none text-sm"
      />
    </div>
  );
}
