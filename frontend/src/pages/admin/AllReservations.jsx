import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function AllReservations() {
  const [reservations, setReservations] = useState([]);
  const [cities, setCities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [resRes, cityRes] = await Promise.all([api.get('/reservations'), api.get('/cities')]);
      setReservations(resRes.data);
      setCities(cityRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visible = useMemo(() => {
    return reservations.filter(
      (r) =>
        (statusFilter ? r.status === statusFilter : true) &&
        (cityFilter ? r.board?.city?.name === cityFilter : true)
    );
  }, [reservations, statusFilter, cityFilter]);

  const countByStatus = useMemo(() => {
    const map = { pending: 0, approved: 0, rejected: 0 };
    for (const r of reservations) if (map[r.status] !== undefined) map[r.status] += 1;
    return map;
  }, [reservations]);

  const columns = [
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.advertiser?.name || '—'}</p>
          <p className="text-xs text-gray-500">{row.advertiser?.email}</p>
        </div>
      ),
    },
    {
      key: 'board',
      label: 'Board',
      render: (row) => (
        <div>
          <p className="text-ink">{row.board?.name || '—'}</p>
          <p className="text-xs text-gray-500">{row.board?.location}</p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (row) => row.board?.city?.name || '—',
    },
    {
      key: 'slot',
      label: 'Slot',
      render: (row) => (
        <div>
          <p className="text-ink">{new Date(row.timeslot?.startTime).toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            → {new Date(row.timeslot?.endTime).toLocaleString()}
          </p>
        </div>
      ),
      sortValue: (row) => row.timeslot?.startTime,
    },
    {
      key: 'creative',
      label: 'Ad Creative',
      render: (row) =>
        row.adCreativeUrl ? (
          <a
            href={row.adCreativeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-signal hover:underline"
          >
            View
          </a>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="All Reservations"
        subtitle="Every booking network-wide. Read-only — approvals are handled by city managers."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading reservations..." />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-48">
              <Select
                label="Filter by status"
                value={statusFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'pending', label: `Pending (${countByStatus.pending})` },
                  { value: 'approved', label: `Approved (${countByStatus.approved})` },
                  { value: 'rejected', label: `Rejected (${countByStatus.rejected})` },
                ]}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Filter by city"
                value={cityFilter}
                options={[
                  { value: '', label: 'All cities' },
                  ...cities.map((c) => ({ value: c.name, label: c.name })),
                ]}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
          </div>

          <Table
            columns={columns}
            rows={visible}
            emptyMessage="No reservations match the selected filters."
          />
        </>
      )}
    </div>
  );
}
