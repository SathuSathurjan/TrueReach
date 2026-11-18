import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageAdvertisers() {
  const [advertisers, setAdvertisers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingAdvertiserId, setUpdatingAdvertiserId] = useState(null);

  const loadData = async () => {
    try {
      const [userRes, resRes] = await Promise.all([
        api.get('/users', { params: { role: 'advertiser' } }),
        api.get('/reservations'),
      ]);
      setAdvertisers(userRes.data);
      setReservations(resRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load advertisers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const bookingsByAdvertiser = useMemo(() => {
    const map = new Map();
    for (const r of reservations) {
      const id = r.advertiser?._id;
      if (!id) continue;
      const entry = map.get(id) || { bookings: 0, approved: 0 };
      entry.bookings += 1;
      if (r.status === 'approved') entry.approved += 1;
      map.set(id, entry);
    }
    return map;
  }, [reservations]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertiser account? Their reservations will be removed from the network.')) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete advertiser');
    }
  };

  const handleStatusToggle = async (advertiser) => {
    const isActive = advertiser.isActive === false;
    if (!isActive && !window.confirm(
      `Deactivate ${advertiser.name}? They will be unable to sign in until reactivated. Existing reservations will be kept.`
    )) return;

    setError('');
    setUpdatingAdvertiserId(advertiser._id);
    try {
      await api.put(`/users/${advertiser._id}/status`, { isActive });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update advertiser status');
    } finally {
      setUpdatingAdvertiserId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Advertiser' },
    { key: 'email', label: 'Email' },
    {
      key: 'accountStatus',
      label: 'Account status',
      render: (row) => <Badge status={row.isActive === false ? 'inactive' : 'active'} />,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortValue: (row) => row.createdAt,
    },
    {
      key: 'bookings',
      label: 'Bookings',
      render: (row) => bookingsByAdvertiser.get(row._id)?.bookings || 0,
    },
    {
      key: 'approved',
      label: 'Approved',
      render: (row) => bookingsByAdvertiser.get(row._id)?.approved || 0,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={row.isActive === false ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleStatusToggle(row)}
            disabled={updatingAdvertiserId === row._id}
          >
            {row.isActive === false ? 'Reactivate' : 'Deactivate'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row._id)}
            disabled={updatingAdvertiserId === row._id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Advertisers"
        subtitle="Manage advertiser accounts. Deactivated advertisers cannot sign in; their reservations are kept."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading advertisers..." />
      ) : (
        <Table columns={columns} rows={advertisers} emptyMessage="No advertiser accounts yet." />
      )}
    </div>
  );
}
