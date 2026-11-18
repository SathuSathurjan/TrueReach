import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reservations')
      .then((res) => setReservations(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reservations'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'board', label: 'Board', render: (row) => row.board?.name || '—' },
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
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.status === 'approved' ? (
          <Link to={`/advertiser/report/${row._id}`}>
            <Button variant="secondary" size="sm">
              View Impression Report
            </Button>
          </Link>
        ) : (
          <span className="text-xs text-gray-400">
            {row.status === 'pending' ? 'Awaiting approval' : 'Slot was not approved'}
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Reservations"
        subtitle="Track your bookings and view campaign reports."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading reservations..." />
      ) : (
        <Table columns={columns} rows={reservations} emptyMessage="You haven't booked any slots yet. Browse boards to get started." />
      )}
    </div>
  );
}
