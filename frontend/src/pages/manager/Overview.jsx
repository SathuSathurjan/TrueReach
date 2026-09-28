import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Building2, MonitorPlay, ClipboardList, CalendarClock, Users, Car,
  MapPin, CheckCircle2, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

function ResStatus({ status }) {
  const map = {
    pending: { icon: Clock, bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
    approved: { icon: CheckCircle2, bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    rejected: { icon: XCircle, bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <Icon size={10.5} /> {s.label}
    </span>
  );
}

export default function Overview() {
  const [boards, setBoards] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [impressions, setImpressions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [boardRes, resRes, impRes] = await Promise.all([
        api.get('/boards'),
        api.get('/reservations'),
        api.get('/impressions'),
      ]);
      setBoards(boardRes.data);
      setReservations(resRes.data);
      setImpressions(impRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBoards = boards.length;
  const activeBoards = boards.filter((b) => b.status === 'active').length;
  const idleBoards = totalBoards - activeBoards;

  const pending = reservations.filter((r) => r.status === 'pending');
  const approved = reservations.filter((r) => r.status === 'approved');
  const rejected = reservations.filter((r) => r.status === 'rejected');

  const totalPeople = impressions.reduce((s, i) => s + (i.people_count || 0), 0);
  const totalVehicles = impressions.reduce((s, i) => s + (i.vehicle_count || 0), 0);

  const trend = useMemo(() => {
    const map = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), {
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        people: 0,
        vehicles: 0,
      });
    }
    for (const imp of impressions) {
      const day = new Date(imp.recorded_at).toISOString().slice(0, 10);
      if (map.has(day)) {
        map.get(day).people += imp.people_count || 0;
        map.get(day).vehicles += imp.vehicle_count || 0;
      }
    }
    return [...map.values()];
  }, [impressions]);

  const split = [
    { name: 'Approved', value: approved.length, color: '#2563EB' },
    { name: 'Pending', value: pending.length, color: '#22D3EE' },
    { name: 'Rejected', value: rejected.length, color: '#F4536A' },
  ].filter((s) => s.value > 0);

  const recentReservations = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(b.timeslot?.startTime || 0) - new Date(a.timeslot?.startTime || 0))
      .slice(0, 5);
  }, [reservations]);

  const notifications = useMemo(() => {
    const items = [];
    if (pending.length > 0) {
      items.push({
        icon: Clock,
        bg: '#FEF3C7',
        color: '#D97706',
        title: `${pending.length} ad approval${pending.length > 1 ? 's' : ''} awaiting review`,
        sub: pending[0]?.advertiser?.name ? `Earliest: ${pending[0].advertiser.name}` : 'Review in the approval queue',
      });
    }
    if (idleBoards > 0) {
      items.push({
        icon: AlertTriangle,
        bg: '#F1F3F9',
        color: '#6B7386',
        title: `${idleBoards} board${idleBoards > 1 ? 's' : ''} currently idle`,
        sub: 'Consider adding more time slots',
      });
    }
    if (approved.length > 0) {
      items.push({
        icon: CheckCircle2,
        bg: '#DCFCE7',
        color: '#16A34A',
        title: `${approved.length} active campaign${approved.length > 1 ? 's' : ''} running`,
        sub: 'Tracked on your boards',
      });
    }
    if (rejected.length > 0) {
      items.push({
        icon: XCircle,
        bg: '#FEE2E2',
        color: '#DC2626',
        title: `${rejected.length} reservation${rejected.length > 1 ? 's' : ''} rejected`,
        sub: 'Rejected bookings over time',
      });
    }
    return items;
  }, [pending, idleBoards, approved, rejected]);

  return (
    <div>
      <PageHeader title="Overview" subtitle="A summary of activity across your city." />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading overview..." />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Boards" value={totalBoards} sub="In your city" icon={Building2} from="#2563EB" to="#3B82F6" />
            <StatCard label="Active Boards" value={`${activeBoards} / ${totalBoards}`} sub="Currently online" icon={MonitorPlay} from="#06B6D4" to="#22D3EE" />
            <StatCard label="Pending Approvals" value={pending.length} sub="Awaiting your review" icon={ClipboardList} from="#4F46E5" to="#818CF8" />
            <StatCard label="Total Reservations" value={reservations.length} sub={`${approved.length} approved`} icon={CalendarClock} from="#8B5CF6" to="#A78BFA" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card title="Audience trend — last 14 days" className="lg:col-span-3">
              {impressions.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="mPeopleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mVehicleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                    <XAxis dataKey="label" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7EAF3', fontSize: 12 }} />
                    <Area type="monotone" dataKey="people" name="People" stroke="#2563EB" strokeWidth={2.5} fill="url(#mPeopleFill)" />
                    <Area type="monotone" dataKey="vehicles" name="Vehicles" stroke="#22D3EE" strokeWidth={2.5} fill="url(#mVehicleFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No impression data recorded yet.
                </p>
              )}
              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-hairline pt-5 sm:grid-cols-2">
                <StatCard label="People Seen" value={totalPeople.toLocaleString()} sub="On your boards" icon={Users} from="#2563EB" to="#3B82F6" />
                <StatCard label="Vehicles Seen" value={totalVehicles.toLocaleString()} sub="On your boards" icon={Car} from="#06B6D4" to="#22D3EE" />
              </div>
            </Card>

            <Card title="Reservation status" className="lg:col-span-2">
              {split.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No reservations yet.
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={split} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {split.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-col gap-2">
                    {split.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-2" style={{ color: '#6B7386' }}>
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
                        </span>
                        <span className="font-semibold" style={{ color: '#161B23' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card title="Recent reservations" className="lg:col-span-3">
              {recentReservations.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No reservations yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentReservations.map((r) => (
                    <div key={r._id} className="flex flex-col gap-1 pb-3" style={{ borderBottom: '1px solid #F1F3F9' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold" style={{ color: '#161B23' }}>
                          {r.advertiser?.name || '—'}
                        </span>
                        <ResStatus status={r.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: '#8B93A7' }}>
                          <MapPin size={12} /> {r.board?.name || '—'}
                        </span>
                        <span className="text-[11px]" style={{ color: '#A5ABB9' }}>
                          {r.timeslot?.startTime ? new Date(r.timeslot.startTime).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Notifications" className="lg:col-span-2">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  You're all caught up.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map((n, i) => {
                    const Icon = n.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#F8F9FC' }}>
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: n.bg }}
                        >
                          <Icon size={14} style={{ color: n.color }} />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: '#161B23' }}>
                            {n.title}
                          </div>
                          <div className="mt-0.5 text-[11.5px]" style={{ color: '#8B93A7' }}>
                            {n.sub}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
