import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageAdvertisers() {
  const [advertisers, setAdvertisers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  const visibleAdvertisers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return advertisers;
    return advertisers.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [advertisers, query]);

  const columns = [
    { key: 'name', label: 'Advertiser' },
    { key: 'email', label: 'Email' },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
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
        <Button variant="danger" size="sm" onClick={() => handleDelete(row._id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Advertisers"
        subtitle="All advertiser accounts on the platform. New advertisers self-register."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading advertisers..." />
      ) : (
        <>
          <div className="mb-4 flex w-full sm:w-72">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search advertisers by name or email..."
            />
          </div>
          <Table
            columns={columns}
            rows={visibleAdvertisers}
            emptyMessage={query ? 'No advertisers match your search.' : 'No advertiser accounts yet.'}
          />
        </>
      )}
    </div>
  );
}
