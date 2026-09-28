export default function BarChart({
  data,
  height = 180,
  valueKey = 'value',
  labelKey = 'label',
}) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-1 flex-col justify-end"
          title={`${d[labelKey]}: ${d[valueKey]}`}
        >
          <div
            className="rounded-t-lg transition-all"
            style={{
              background: 'linear-gradient(180deg, #3B82F6, #2563EB)',
              height: `${Math.max(4, Math.round((d[valueKey] / max) * (height - 24)))}px`,
            }}
          />
          <p className="mt-1.5 truncate text-center text-[10px] text-gray-500">{d[labelKey]}</p>
        </div>
      ))}
    </div>
  );
}
