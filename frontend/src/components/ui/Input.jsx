export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-ink">{label}</label>}
      <input
        className={`rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-ink
          placeholder:text-gray-400
          focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal-light
          ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
