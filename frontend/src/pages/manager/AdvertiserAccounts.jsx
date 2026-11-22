import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';
import AdvertiserDetailsModal from '../../components/ui/AdvertiserDetailsModal';

export default function AdvertiserAccounts() {
  const [reservations, setReservations] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
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
        phone: adv.phone,
        companyName: adv.companyName,
        companyEmail: adv.companyEmail,
        companyPhone: adv.companyPhone,
        bookings: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        reservations: [],
      };
      entry.bookings += 1;
      if (r.status === 'approved') entry.approved += 1;
      if (r.status === 'pending') entry.pending += 1;
      if (r.status === 'rejected') entry.rejected += 1;
      entry.reservations.push(r);
      map.set(adv._id, entry);
    }
    return [...map.values()].sort((a, b) => b.bookings - a.bookings);
  }, [reservations]);

  const columns = [
    {
      key: 'name',
      label: 'Advertiser',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedAdvertiser(row)}
          className="text-left font-medium text-signal hover:underline"
        >
          {row.name}
        </button>
      ),
    },
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
        <Table columns={columns} rows={advertisers} emptyMessage="No advertisers have booked boards in your city yet." />
      )}

      {selectedAdvertiser && (
        <AdvertiserDetailsModal
          advertiser={selectedAdvertiser}
          reservations={selectedAdvertiser.reservations}
          onClose={() => setSelectedAdvertiser(null)}
        />
      )}
    </div>
  );
}
