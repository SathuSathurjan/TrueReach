import { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';
import AdvertiserDetailsModal from '../../components/ui/AdvertiserDetailsModal';

export default function AdApprovalQueue() {
  const [reservations, setReservations] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/reservations/${id}/approve`);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve reservation');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/reservations/${id}/reject`);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject reservation');
    }
  };

  const pending = reservations.filter((r) => r.status === 'pending');
  const others = reservations.filter((r) => r.status !== 'pending');
  const advertiserReservations = selectedAdvertiser
    ? reservations.filter((reservation) => reservation.advertiser?._id === selectedAdvertiser._id)
    : [];

  const renderAdvertiser = (advertiser) => (
    <div>
      <button
        type="button"
        onClick={() => setSelectedAdvertiser(advertiser)}
        disabled={!advertiser?._id}
        className="text-left font-medium text-signal hover:underline disabled:text-ink disabled:no-underline"
      >
        {advertiser?.name || '—'}
      </button>
      {advertiser?.email && <p className="text-xs text-gray-500">{advertiser.email}</p>}
    </div>
  );

  const pendingColumns = [
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (row) => renderAdvertiser(row.advertiser),
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
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => handleApprove(row._id)}>
            Approve
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleReject(row._id)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    { key: 'advertiser', label: 'Advertiser', render: (row) => renderAdvertiser(row.advertiser) },
    { key: 'board', label: 'Board', render: (row) => row.board?.name || '—' },
    {
      key: 'slot',
      label: 'Slot',
      render: (row) => new Date(row.timeslot?.startTime).toLocaleString(),
      sortValue: (row) => row.timeslot?.startTime,
    },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Ad Approval Queue"
        subtitle="Approve or reject advertiser bookings on boards in your city."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading reservations..." />
      ) : (
        <div className="flex flex-col gap-6">
          <Card title={`Pending approvals (${pending.length})`}>
            <Table
              columns={pendingColumns}
              rows={pending}
              emptyMessage="No reservations awaiting approval."
            />
          </Card>

          <Card title="History">
            <Table
              columns={historyColumns}
              rows={others}
              emptyMessage="No processed reservations yet."
            />
          </Card>
        </div>
      )}

      {selectedAdvertiser && (
        <AdvertiserDetailsModal
          advertiser={selectedAdvertiser}
          reservations={advertiserReservations}
          onClose={() => setSelectedAdvertiser(null)}
        />
      )}
    </div>
  );
}
