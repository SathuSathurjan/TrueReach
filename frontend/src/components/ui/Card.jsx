export default function Card({ title, action, className = '', children }) {
  return (
    <div className={`rounded-2xl border border-border bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          {title && (
            <h3 className="font-display text-[14.5px] font-bold" style={{ color: '#161B23' }}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className={title || action ? 'p-5 pt-4' : 'p-5'}>{children}</div>
    </div>
  );
}
