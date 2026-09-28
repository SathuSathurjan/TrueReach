export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[19px] font-bold" style={{ color: '#161B23' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px]" style={{ color: '#8B93A7' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
