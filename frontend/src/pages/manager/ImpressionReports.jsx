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

export default function ImpressionReports() {
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

  const byBoard = useMemo(() => {
    const map = new Map();
    for (const imp of impressions) {
      const id = imp.board?._id || 'unknown';
      const name = imp.board?.name || 'Unknown board';
      const entry = map.get(id) || {
        _id: id,
        board: name,
        location: imp.board?.location || '',
        people: 0,
        vehicles: 0,
        readings: 0,
      };
      entry.people += imp.people_count || 0;
      entry.vehicles += imp.vehicle_count || 0;
      entry.readings += 1;
      map.set(id, entry);
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
  const visibleBoards = useMemo(
    () => byBoard.filter((b) => !q || b.board.toLowerCase().includes(q) || (b.location || '').toLowerCase().includes(q)),
    [byBoard, q]
  );
  const visibleReadings = useMemo(
    () =>
      impressions
        .filter((i) => !q || (i.board?.name || '').toLowerCase().includes(q))
        .slice(0, 20),
    [impressions, q]
  );

  const boardColumns = [
    { key: 'board', label: 'Board' },
    { key: 'location', label: 'Location' },
    { key: 'readings', label: 'Readings', render: (r) => r.readings.toLocaleString() },
    { key: 'people', label: 'People', render: (r) => r.people.toLocaleString() },
    { key: 'vehicles', label: 'Vehicles', render: (r) => r.vehicles.toLocaleString() },
  ];

  const readingColumns = [
    { key: 'time', label: 'Time', render: (r) => new Date(r.recorded_at).toLocaleString() },
    { key: 'board', label: 'Board', render: (r) => r.board?.name || '—' },
    { key: 'people', label: 'People', render: (r) => r.people_count },
    { key: 'vehicles', label: 'Vehicles', render: (r) => r.vehicle_count },
  ];

  return (
    <div>
      <PageHeader
        title="Impression Reports"
        subtitle="Aggregated audience data across all boards in your city."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading reports..." />
      ) : impressions.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
            No impression data recorded for your boards yet.
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

          <Card title="Per board">
            <div className="mb-4 flex w-full sm:w-72">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search boards..."
              />
            </div>
            <Table columns={boardColumns} rows={visibleBoards} emptyMessage={q ? 'No boards match your search.' : 'No data'} />
          </Card>

          <Card title="Recent readings">
            <Table
              columns={readingColumns}
              rows={visibleReadings}
              emptyMessage={q ? 'No readings match your search.' : 'No readings yet.'}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
