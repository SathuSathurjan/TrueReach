const styles = {
  error: { bg: '#FEE2E2', fg: '#DC2626' },
  success: { bg: '#DCFCE7', fg: '#16A34A' },
};

export default function Alert({ type = 'error', children }) {
  const s = styles[type] || styles.error;
  return (
    <div
      className="mb-4 rounded-xl border px-4 py-3 text-[13px] font-medium"
      style={{ background: s.bg, borderColor: s.bg, color: s.fg }}
    >
      {children}
    </div>
  );
}
