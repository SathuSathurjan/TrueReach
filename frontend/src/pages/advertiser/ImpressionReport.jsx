import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Car, Activity, TrendingUp, Radio } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ImpressionReport() {
  const { reservationId } = useParams();
  const [summary, setSummary] = useState(null);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/impressions/summary/${reservationId}`),
      api.get('/impressions', { params: { reservation: reservationId } }),
    ])
      .then(([summaryRes, readingsRes]) => {
        setSummary(summaryRes.data);
        setReadings(readingsRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [reservationId]);

  const columns = [
    { key: 'time', label: 'Time', render: (r) => new Date(r.recorded_at).toLocaleString(), sortValue: (r) => r.recorded_at },
    { key: 'people', label: 'People', render: (r) => r.people_count },
    { key: 'vehicles', label: 'Vehicles', render: (r) => r.vehicle_count },
  ];

  return (
    <div>
      <Link to="/advertiser/reservations" className="mb-4 inline-block text-[13px] font-medium text-signal hover:underline">
        ← Back to My Reservations
      </Link>
      <PageHeader
        title="Campaign Impression Report"
        subtitle="Audience reached during your approved booking."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading report..." />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard label="Total People" value={(summary?.totalPeople ?? 0).toLocaleString()} icon={Users} from="#2563EB" to="#3B82F6" />
            <StatCard label="Total Vehicles" value={(summary?.totalVehicles ?? 0).toLocaleString()} icon={Car} from="#06B6D4" to="#22D3EE" />
            <StatCard label="Data Points" value={(summary?.dataPoints ?? 0).toLocaleString()} icon={Activity} from="#0EA5E9" to="#38BDF8" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <StatCard
              label="Avg People / Reading"
              value={(summary?.avgPeoplePerReading ?? 0).toFixed(1)}
              icon={TrendingUp}
              from="#4F46E5"
              to="#818CF8"
            />
            <StatCard
              label="Avg Vehicles / Reading"
              value={(summary?.avgVehiclesPerReading ?? 0).toFixed(1)}
              icon={Radio}
              from="#8B5CF6"
              to="#A78BFA"
            />
          </div>

          <Card title="Raw readings">
            <Table
              columns={columns}
              rows={readings}
              emptyMessage="No impression data recorded yet."
            />
          </Card>
        </div>
      )}
    </div>
  );
}
