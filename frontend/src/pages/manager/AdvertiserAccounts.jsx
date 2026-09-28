import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function AdvertiserAccounts() {
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reservations')
      .then((res) => setReservations(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reservations'))
      .finally(() => setLoading(false));
  }, []);

  const advertisers = useMemo(() => {
    const map = new Map();
    for (const r of reservations) {
      const adv = r.advertiser;
      if (!adv?._id) continue;
      const entry = map.get(adv._id) || {
        _id: adv._id,
        name: adv.name,
        email: adv.email,
        bookings: 0,
        approved: 0,
        pending: 0,
      };
      entry.bookings += 1;
      if (r.status === 'approved') entry.approved += 1;
      if (r.status === 'pending') entry.pending += 1;
      map.set(adv._id, entry);
    }
    return [...map.values()].sort((a, b) => b.bookings - a.bookings);
  }, [reservations]);

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
    { key: 'bookings', label: 'Bookings', render: (r) => r.bookings },
    { key: 'approved', label: 'Approved', render: (r) => r.approved },
    { key: 'pending', label: 'Pending', render: (r) => r.pending },
  ];

  return (
    <div>
      <PageHeader
        title="Advertiser Accounts"
        subtitle="Advertisers who have booked boards in your city."
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
            emptyMessage={query ? 'No advertisers match your search.' : 'No advertisers have booked boards in your city yet.'}
          />
        </>
      )}
    </div>
  );
}
