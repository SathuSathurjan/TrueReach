import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Building2, MonitorPlay, CalendarClock, ClipboardList, Users, Car, MapPin,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function Overview() {
  const [cities, setCities] = useState([]);
  const [boards, setBoards] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [impressions, setImpressions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cityRes, boardRes, resRes, impRes] = await Promise.all([
        api.get('/cities'),
        api.get('/boards'),
        api.get('/reservations'),
        api.get('/impressions'),
      ]);
      setCities(cityRes.data);
      setBoards(boardRes.data);
      setReservations(resRes.data);
      setImpressions(impRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pending = reservations.filter((r) => r.status === 'pending');

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

  const boardsByCity = useMemo(() => {
    const map = new Map();
    for (const city of cities) map.set(String(city._id), 0);
    for (const b of boards) {
      const cityId = typeof b.city === 'object' ? b.city?._id : b.city;
      if (cityId != null && map.has(String(cityId))) {
        const key = String(cityId);
        map.set(key, map.get(key) + 1);
      }
    }
    return cities.map((city) => ({ name: city.name, count: map.get(String(city._id)) || 0 }));
  }, [cities, boards]);

  const totalPeople = impressions.reduce((s, i) => s + (i.people_count || 0), 0);
  const totalVehicles = impressions.reduce((s, i) => s + (i.vehicle_count || 0), 0);

  return (
    <div>
      <PageHeader
        title="Network Overview"
        subtitle="High-level performance across all cities."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading overview..." />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Cities" value={cities.length} icon={Building2} from="#2563EB" to="#3B82F6" linkTo="/admin/cities" />
            <StatCard label="Total Boards" value={boards.length} icon={MonitorPlay} from="#06B6D4" to="#22D3EE" linkTo="/admin/boards" />
            <StatCard label="Total Reservations" value={reservations.length} icon={CalendarClock} from="#0EA5E9" to="#38BDF8" linkTo="/admin/reservations" />
            <StatCard
              label="Pending Approvals"
              value={pending.length}
              sub={pending.length > 0 ? 'Awaiting city manager action' : 'All caught up'}
              icon={ClipboardList}
              from="#4F46E5"
              to="#818CF8"
              linkTo="/admin/reservations?status=pending"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card title="Network audience reach (14 days)" className="lg:col-span-2">
              {trend.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                    <XAxis dataKey="label" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7EAF3', fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" name="People" stroke="#2563EB" strokeWidth={2.5} fill="url(#trendFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No impression data recorded yet.
                </p>
              )}
              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-hairline pt-5 sm:grid-cols-2">
                <StatCard
                  label="People Seen"
                  value={totalPeople.toLocaleString()}
                  sub="All-time people impressions"
                  icon={Users}
                  from="#2563EB"
                  to="#3B82F6"
                />
                <StatCard
                  label="Vehicles Seen"
                  value={totalVehicles.toLocaleString()}
                  sub="All-time vehicle impressions"
                  icon={Car}
                  from="#06B6D4"
                  to="#22D3EE"
                />
              </div>
            </Card>

            <Card title="Boards per city">
              {boardsByCity.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No cities yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {boardsByCity.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-[13px]"
                      style={{ color: '#2A303C' }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin size={14} style={{ color: '#8B93A7' }} />
                        {c.name}
                      </span>
                      <span className="font-semibold" style={{ color: '#2563EB' }}>
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
