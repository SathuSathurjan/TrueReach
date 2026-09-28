import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  MonitorPlay, ClipboardList, XCircle, Users, Car,
  MapPin, CheckCircle2, Clock, TrendingUp, Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [reservations, setReservations] = useState([]);
  const [impressions, setImpressions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [resRes, impRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/impressions'),
      ]);
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

  const approved = reservations.filter((r) => r.status === 'approved');
  const pending = reservations.filter((r) => r.status === 'pending');
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
        title: `${pending.length} booking${pending.length > 1 ? 's' : ''} awaiting approval`,
        sub: 'A city manager needs to review these',
      });
    }
    if (approved.length > 0) {
      items.push({
        icon: CheckCircle2,
        bg: '#DCFCE7',
        color: '#16A34A',
        title: `${approved.length} active campaign${approved.length > 1 ? 's' : ''}`,
        sub: 'View reports from your approved bookings',
      });
    }
    if (rejected.length > 0) {
      items.push({
        icon: XCircle,
        bg: '#FEE2E2',
        color: '#DC2626',
        title: `${rejected.length} booking${rejected.length > 1 ? 's' : ''} not approved`,
        sub: 'Try booking a different time slot',
      });
    }
    return items;
  }, [pending, approved, rejected]);

  return (
    <div>
      <PageHeader title="Overview" subtitle="A summary of your campaigns and audience reach." />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading overview..." />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Advertisements" value={reservations.length} sub="All your bookings" icon={MonitorPlay} from="#2563EB" to="#3B82F6" />
            <StatCard label="Active Campaigns" value={approved.length} sub="Approved & running" icon={CheckCircle2} from="#06B6D4" to="#22D3EE" />
            <StatCard label="Pending Approval" value={pending.length} sub="Awaiting review" icon={ClipboardList} from="#4F46E5" to="#818CF8" />
            <StatCard label="Not Approved" value={rejected.length} sub="Rejected bookings" icon={XCircle} from="#F4536A" to="#FB7185" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card title="Audience reached — last 14 days" className="lg:col-span-3">
              {impressions.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="aPeopleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aVehicleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                    <XAxis dataKey="label" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7EAF3', fontSize: 12 }} />
                    <Area type="monotone" dataKey="people" name="People" stroke="#2563EB" strokeWidth={2.5} fill="url(#aPeopleFill)" />
                    <Area type="monotone" dataKey="vehicles" name="Vehicles" stroke="#22D3EE" strokeWidth={2.5} fill="url(#aVehicleFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No impression data for your approved campaigns yet.
                </p>
              )}
              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-hairline pt-5 sm:grid-cols-2">
                <StatCard label="People Reached" value={totalPeople.toLocaleString()} sub="Across your campaigns" icon={Users} from="#2563EB" to="#3B82F6" />
                <StatCard label="Vehicles Reached" value={totalVehicles.toLocaleString()} sub="Across your campaigns" icon={Car} from="#06B6D4" to="#22D3EE" />
              </div>
            </Card>

            <Card title="Booking status" className="lg:col-span-2">
              {split.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  No bookings yet. Browse boards to get started.
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
            <Card title="Recent bookings" className="lg:col-span-3">
              {recentReservations.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: '#8B93A7' }}>
                  You haven't booked any slots yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentReservations.map((r) => (
                    <div key={r._id} className="flex flex-col gap-1 pb-3" style={{ borderBottom: '1px solid #F1F3F9' }}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#161B23' }}>
                          <MapPin size={13} style={{ color: '#8B93A7' }} />
                          {r.board?.name || '—'}
                        </span>
                        <ResStatus status={r.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: '#8B93A7' }}>
                          {r.board?.location || ''}
                          {r.board?.city?.name ? ` · ${r.board.city.name}` : ''}
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
                  No notifications right now.
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
                  {approved.length > 0 && (
                    <Link
                      to="/advertiser/reservations"
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-signal hover:underline"
                    >
                      <Eye size={13} /> View all reservations
                    </Link>
                  )}
                </div>
              )}
            </Card>
          </div>

          {approved.length > 0 && (
            <Card title="Campaign performance">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <StatCard
                  label="Total People Reached"
                  value={totalPeople.toLocaleString()}
                  sub="All approved campaigns"
                  icon={TrendingUp}
                  from="#2563EB"
                  to="#3B82F6"
                />
                <StatCard
                  label="Avg Reach per Campaign"
                  value={approved.length > 0 ? Math.round(totalPeople / approved.length).toLocaleString() : '0'}
                  sub="People per active campaign"
                  icon={Users}
                  from="#4F46E5"
                  to="#818CF8"
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
