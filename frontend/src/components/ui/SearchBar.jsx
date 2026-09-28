import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8B93A7' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl py-2 pl-9 pr-9 text-[13px] text-ink outline-none transition-colors placeholder:text-gray-400
          focus:border-signal focus:ring-2 focus:ring-signal-light"
        style={{ background: '#fff', border: '1px solid #E7EAF3' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-[#F1F3F9]"
          style={{ color: '#8B93A7', cursor: 'pointer' }}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
