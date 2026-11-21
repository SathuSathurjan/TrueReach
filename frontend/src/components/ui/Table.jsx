import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

const EMPTY_ROWS = [];

function getText(value) {
  if (value == null || typeof value === 'boolean') return value == null ? '' : String(value);
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(getText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    if ('props' in value) {
      const { children, status, label } = value.props || {};
      return getText(children ?? label ?? status ?? '');
    }
    return Object.entries(value)
      .filter(([key]) => !key.startsWith('_'))
      .map(([, item]) => getText(item))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function compareValues(a, b) {
  if (a == null || a === '') return b == null || b === '' ? 0 : 1;
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;

  const left = getText(a);
  const right = getText(b);
  const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value);
  const leftDate = isIsoDate(left) ? Date.parse(left) : NaN;
  const rightDate = isIsoDate(right) ? Date.parse(right) : NaN;
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
    return leftDate - rightDate;
  }
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function getLatestTimestamp(row) {
  if (!row || typeof row !== 'object') return null;

  const candidates = [
    row.updatedAt,
    row.createdAt,
    row.startTime,
    row.endTime,
    row.date,
    row.timestamp,
  ];

  for (const candidate of candidates) {
    if (candidate) {
      const timestamp = candidate instanceof Date ? candidate.getTime() : Date.parse(candidate);
      if (Number.isFinite(timestamp)) return timestamp;
    }
  }

  for (const value of Object.values(row)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedTimestamp = getLatestTimestamp(value);
      if (nestedTimestamp != null) return nestedTimestamp;
    }
  }

  return null;
}

export default function Table({
  columns,
  rows,
  emptyMessage = 'No data to display',
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] || 10);
  const [page, setPage] = useState(1);
  const data = Array.isArray(rows) ? rows : EMPTY_ROWS;

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data;
    return data.filter((row) => {
      const searchableText = [
        getText(row),
        ...columns.map((column) => (
          column.searchValue?.(row) ?? getText(column.render ? column.render(row) : row[column.key])
        )),
      ].join(' ').toLowerCase();
      return searchableText.includes(search);
    });
  }, [columns, data, query]);

  const sortedRows = useMemo(() => {
    if (!sort.key) {
      const rowsWithTimestamps = filteredRows.some((row) => getLatestTimestamp(row) != null);
      if (!rowsWithTimestamps) return filteredRows;
      return [...filteredRows].sort((a, b) => {
        const timestampA = getLatestTimestamp(a);
        const timestampB = getLatestTimestamp(b);
        if (timestampA == null && timestampB == null) return 0;
        if (timestampA == null) return 1;
        if (timestampB == null) return -1;
        return timestampB - timestampA;
      });
    }
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valueA = column.sortValue
        ? column.sortValue(a)
        : a[column.key] ?? (column.render ? column.render(a) : '');
      const valueB = column.sortValue
        ? column.sortValue(b)
        : b[column.key] ?? (column.render ? column.render(b) : '');
      const result = compareValues(valueA, valueB);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, filteredRows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const handleSearch = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const handlePageSize = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const toggleSort = (column) => {
    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  const firstItem = sortedRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, sortedRows.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-hairline p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full items-center gap-2 sm:max-w-sm">
          <span className="shrink-0 text-xs font-medium text-secondary">Search</span>
          <input
            type="search"
            value={query}
            onChange={handleSearch}
            placeholder="Search this table..."
            aria-label="Search table"
            className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-signal"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-secondary">
          Rows per page
          <select
            value={pageSize}
            onChange={handlePageSize}
            className="rounded-lg border border-border bg-white px-2 py-2 text-[13px] text-ink outline-none focus:border-signal"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr>
              {columns.map((column) => {
                const isSorted = sort.key === column.key;
                const SortIcon = !isSorted ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.key}
                    aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-tertiary"
                  >
                    {column.label ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className="inline-flex items-center gap-1.5 text-left hover:text-ink"
                        aria-label={`Sort by ${column.label}${isSorted ? `, currently ${sort.direction}ending` : ''}`}
                      >
                        {column.label}
                        <SortIcon size={13} aria-hidden="true" />
                      </button>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-gray-500">
                  {query.trim() ? 'No matching records found.' : emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={row._id || `${page}-${index}`} className="transition-colors hover:bg-[#F8F9FC]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-3.5 align-middle text-[13px]" style={{ color: '#2A303C' }}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline px-4 py-3 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {firstItem}–{lastItem} of {sortedRows.length}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-20 text-center">Page {page} of {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount}
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
