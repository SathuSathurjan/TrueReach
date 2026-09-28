export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-10 text-[13px]" style={{ color: '#8B93A7' }}>
      <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: '#2563EB' }} />
      {label}
    </div>
  );
}
