import { useState, useEffect, useMemo } from 'react';
import { Users, Car, Activity } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import BarChart from '../../components/ui/BarChart';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ImpressionAnalytics() {
  const [impressions, setImpressions] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/impressions')
      .then((res) => setImpressions(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load impressions'))
      .finally(() => setLoading(false));
  }, []);

  const totalPeople = impressions.reduce((s, i) => s + (i.people_count || 0), 0);
  const totalVehicles = impressions.reduce((s, i) => s + (i.vehicle_count || 0), 0);

  const byCity = useMemo(() => {
    const map = new Map();
    for (const imp of impressions) {
      const name = imp.board?.city?.name || 'Unknown';
      const e = map.get(name) || { city: name, people: 0, vehicles: 0, readings: 0 };
      e.people += imp.people_count || 0;
      e.vehicles += imp.vehicle_count || 0;
      e.readings += 1;
      map.set(name, e);
    }
    return [...map.values()].sort((a, b) => b.people - a.people);
  }, [impressions]);

  const byBoard = useMemo(() => {
    const map = new Map();
    for (const imp of impressions) {
      const name = imp.board?.name || 'Unknown board';
      const e = map.get(name) || { board: name, people: 0, vehicles: 0, readings: 0 };
      e.people += imp.people_count || 0;
      e.vehicles += imp.vehicle_count || 0;
      e.readings += 1;
      map.set(name, e);
    }
    return [...map.values()].sort((a, b) => b.people - a.people);
  }, [impressions]);

  const trend = useMemo(() => {
    const map = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), {
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: 0,
      });
    }
    for (const imp of impressions) {
      const day = new Date(imp.recorded_at).toISOString().slice(0, 10);
      if (map.has(day)) map.get(day).value += imp.people_count || 0;
    }
    return [...map.values()];
  }, [impressions]);

  const q = query.trim().toLowerCase();
  const visibleCities = useMemo(
    () => byCity.filter((c) => !q || c.city.toLowerCase().includes(q)),
    [byCity, q]
  );
  const visibleBoards = useMemo(
    () => byBoard.filter((b) => !q || b.board.toLowerCase().includes(q)),
    [byBoard, q]
  );

  const cityColumns = [
    { key: 'city', label: 'City' },
    { key: 'readings', label: 'Readings', render: (r) => r.readings.toLocaleString() },
    { key: 'people', label: 'People', render: (r) => r.people.toLocaleString() },
    { key: 'vehicles', label: 'Vehicles', render: (r) => r.vehicles.toLocaleString() },
  ];

  const boardColumns = [
    { key: 'board', label: 'Board' },
    { key: 'readings', label: 'Readings', render: (r) => r.readings.toLocaleString() },
    { key: 'people', label: 'People', render: (r) => r.people.toLocaleString() },
    { key: 'vehicles', label: 'Vehicles', render: (r) => r.vehicles.toLocaleString() },
  ];

  return (
    <div>
      <PageHeader
        title="Impression Analytics"
        subtitle="Network-wide audience data from tracked boards."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading analytics..." />
      ) : impressions.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
            No impression data recorded yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard label="People Seen" value={totalPeople.toLocaleString()} icon={Users} from="#2563EB" to="#3B82F6" />
            <StatCard label="Vehicles Seen" value={totalVehicles.toLocaleString()} icon={Car} from="#06B6D4" to="#22D3EE" />
            <StatCard label="Data Points" value={impressions.length.toLocaleString()} icon={Activity} from="#0EA5E9" to="#38BDF8" />
          </div>

          <Card title="Daily people seen (14 days)">
            <BarChart data={trend} valueKey="value" labelKey="label" />
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="Per city">
              <div className="mb-4 flex w-full">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search city or board..."
                />
              </div>
              <Table columns={cityColumns} rows={visibleCities} emptyMessage={q ? 'No cities match your search.' : 'No data'} />
            </Card>
            <Card title="Per board">
              <div className="mb-4 flex w-full">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search city or board..."
                />
              </div>
              <Table columns={boardColumns} rows={visibleBoards} emptyMessage={q ? 'No boards match your search.' : 'No data'} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
