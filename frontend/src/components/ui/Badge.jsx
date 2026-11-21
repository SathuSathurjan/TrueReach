const styles = {
  approved: { bg: '#DCFCE7', fg: '#16A34A' },
  active: { bg: '#DCFCE7', fg: '#16A34A' },
  pending: { bg: '#FEF3C7', fg: '#D97706' },
  rejected: { bg: '#FEE2E2', fg: '#DC2626' },
  inactive: { bg: '#F1F3F9', fg: '#6B7386' },
  idle: { bg: '#F1F3F9', fg: '#6B7386' },
  available: { bg: '#DCFCE7', fg: '#16A34A' },
  booked: { bg: '#EAF1FF', fg: '#2563EB' },
  unavailable: { bg: '#FEE2E2', fg: '#DC2626' },
};

export default function Badge({ status }) {
  const s = styles[status] || styles.inactive;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold capitalize"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
