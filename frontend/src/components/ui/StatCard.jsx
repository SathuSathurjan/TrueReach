const DEFAULT_GRADIENTS = [
  ['#2563EB', '#3B82F6'],
  ['#06B6D4', '#22D3EE'],
  ['#0EA5E9', '#38BDF8'],
  ['#4F46E5', '#818CF8'],
  ['#8B5CF6', '#A78BFA'],
];

export default function StatCard({ label, value, sub, icon: Icon, index = 0, from, to }) {
  const [f, t] = from && to ? [from, to] : DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: `linear-gradient(135deg, ${f}, ${t})` }}
    >
      <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white opacity-10" />
      <div className="absolute -right-2 -top-8 h-20 w-20 rounded-full bg-white opacity-10" />
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[13.5px] font-medium opacity-90">{label}</span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Icon size={16} strokeWidth={2.3} />
          </div>
        )}
      </div>
      <div className="text-[26px] font-bold leading-none tracking-tight">{value}</div>
      {sub && <div className="mt-2 text-[12.5px] opacity-90">{sub}</div>}
    </div>
  );
}
