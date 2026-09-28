export default function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-ink">{label}</label>}
      <select
        className={`rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-ink
          focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal-light ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
