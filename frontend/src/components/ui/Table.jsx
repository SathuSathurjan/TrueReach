export default function Table({ columns, rows, emptyMessage = 'No data to display' }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row._id || i} className="transition-colors hover:bg-[#F8F9FC]">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3.5 align-middle text-[13px]" style={{ color: '#2A303C' }}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
