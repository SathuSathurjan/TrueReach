import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutGrid, Building2, MonitorPlay, Users, ClipboardList, BarChart3,
  Search, Bell, Plus, ChevronRight, Car, CheckCircle2, Clock, XCircle,
  CalendarClock, Check, X,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: Building2, label: "Cities" },
  { icon: MonitorPlay, label: "Boards" },
  { icon: Users, label: "People" },
  { icon: ClipboardList, label: "Reservations" },
  { icon: BarChart3, label: "Analytics" },
];

const INITIAL_CITIES = [
  { name: "Colombo", manager: "R. Fernando", boards: 14, active: 12, status: "healthy" },
  { name: "Kandy", manager: "S. Perera", boards: 8, active: 8, status: "healthy" },
  { name: "Galle", manager: "N. Jayasuriya", boards: 6, active: 4, status: "attention" },
  { name: "Negombo", manager: "A. Silva", boards: 5, active: 5, status: "healthy" },
  { name: "Jaffna", manager: "T. Kumar", boards: 3, active: 2, status: "attention" },
];

const RESERVATIONS = [
  { advertiser: "Dilmah Tea", board: "Colombo — Galle Rd 04", status: "pending", time: "12m ago" },
  { advertiser: "Cargills Food City", board: "Kandy — Peradeniya Rd 02", status: "approved", time: "38m ago" },
  { advertiser: "Softlogic", board: "Negombo — Beach Rd 01", status: "approved", time: "1h ago" },
  { advertiser: "Nations Trust Bank", board: "Galle — Fort Junction 03", status: "rejected", time: "2h ago" },
];

const IMPRESSIONS = [
  { day: "Mon", people: 4200, vehicles: 2100 },
  { day: "Tue", people: 4800, vehicles: 2300 },
  { day: "Wed", people: 5100, vehicles: 2600 },
  { day: "Thu", people: 4600, vehicles: 2200 },
  { day: "Fri", people: 6200, vehicles: 3100 },
  { day: "Sat", people: 7400, vehicles: 3800 },
  { day: "Sun", people: 6800, vehicles: 3400 },
];

const RESERVATION_SPLIT = [
  { name: "Approved", value: 58, color: "#2563EB" },
  { name: "Pending", value: 27, color: "#22D3EE" },
  { name: "Rejected", value: 15, color: "#F4536A" },
];

function KPICard({ label, value, sub, icon: Icon, from, to }) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white opacity-10" />
      <div className="absolute -right-2 -top-8 w-20 h-20 rounded-full bg-white opacity-10" />
      <div className="flex items-center justify-between mb-6">
        <span className="text-[13.5px] font-medium opacity-90">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon size={16} strokeWidth={2.3} />
        </div>
      </div>
      <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
      <div className="text-[12.5px] mt-2 opacity-90">{sub}</div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = status === "healthy" ? "#16A34A" : "#F59E0B";
  return <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />;
}

function ResStatus({ status }) {
  const map = {
    pending: { icon: Clock, bg: "#FEF3C7", color: "#D97706", label: "Pending" },
    approved: { icon: CheckCircle2, bg: "#DCFCE7", color: "#16A34A", label: "Approved" },
    rejected: { icon: XCircle, bg: "#FEE2E2", color: "#DC2626", label: "Rejected" },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: s.bg, color: s.color }}>
      <Icon size={10.5} /> {s.label}
    </span>
  );
}

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState("people");
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState(INITIAL_CITIES);
  const [addingCity, setAddingCity] = useState(false);
  const [cityName, setCityName] = useState("");
  const [toast, setToast] = useState(null);

  const q = query.trim().toLowerCase();
  const filteredCities = cities.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.manager.toLowerCase().includes(q)
  );
  const filteredReservations = RESERVATIONS.filter(
    (r) => !q || r.advertiser.toLowerCase().includes(q) || r.board.toLowerCase().includes(q)
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddCity = () => {
    if (!cityName.trim()) return;
    setCities((prev) => [...prev, { name: cityName.trim(), manager: "Unassigned", boards: 0, active: 0, status: "attention" }]);
    const added = cityName.trim();
    setCityName("");
    setAddingCity(false);
    showToast(`Added city "${added}"`);
  };

  const handleLogout = () => {
    localStorage.removeItem("truereach_token");
    localStorage.removeItem("truereach_user");
    window.location.href = "/login";
  };

  return (
    <div className="w-full min-h-screen" style={{ background: "#EFF2F8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');`}</style>

      <DashboardSidebar
        navItems={NAV.map((n) => ({ ...n, active: activeNav === n.label }))}
        userName="Super Admin"
        userRole="Super Admin"
        initials="SA"
        gradient="linear-gradient(135deg,#2563EB,#818CF8)"
        onSelect={setActiveNav}
        onLogout={handleLogout}
      />

      <main className="px-5 pb-8 pt-[68px] md:ml-[230px] md:px-8 md:pt-6">
        {toast && (
          <div className="fixed top-5 right-5 z-50 px-4 py-2 rounded-xl text-[13px] font-medium text-white" style={{ background: "#16A34A" }}>
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2563EB,#818CF8)" }}>
              <LayoutGrid size={16} color="#fff" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold" style={{ color: "#161B23", fontFamily: "'Space Grotesk', sans-serif" }}>Network Overview</h1>
              <p className="text-[12.5px]" style={{ color: "#8B93A7" }}>High-level performance across all cities</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8B93A7" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boards, cities, advertisers"
                className="pl-9 pr-3 py-2 rounded-xl text-[13px] outline-none w-[240px] transition-colors"
                style={{ background: "#fff", border: "1px solid #E7EAF3", color: "#161B23" }}
              />
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors hover:bg-[#F0F4FF]" style={{ background: "#fff", border: "1px solid #E7EAF3", cursor: "pointer" }}>
              <Bell size={15} style={{ color: "#6B7386" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F4536A" }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-5 mb-6">
          <KPICard label="Active Boards" value="30 / 36" sub="Across 5 cities" icon={MonitorPlay} from="#2563EB" to="#3B82F6" />
          <KPICard label="People Seen" value="12.4K" sub="+12% vs. yesterday" icon={Users} from="#06B6D4" to="#22D3EE" />
          <KPICard label="Vehicles Seen" value="6.0K" sub="Verified count today" icon={Car} from="#0EA5E9" to="#38BDF8" />
          <KPICard label="Pending Approvals" value="7" sub="Awaiting city managers" icon={ClipboardList} from="#4F46E5" to="#818CF8" />
          <KPICard label="Total Reservations" value="18" sub="4 approved · 7 pending" icon={CalendarClock} from="#8B5CF6" to="#A78BFA" />
        </div>

        <div className="grid grid-cols-5 gap-5 mb-6">
          <div className="col-span-3 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>Network impressions — last 7 days</h2>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#F1F3F9" }}>
                {[{ k: "people", l: "People" }, { k: "vehicles", l: "Vehicles" }].map(({ k, l }) => (
                  <button key={k} onClick={() => setTab(k)}
                    className="px-3 py-1 rounded-md text-[12px] font-medium cursor-pointer transition-colors"
                    style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? "#2563EB" : "#8B93A7", boxShadow: tab === k ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={IMPRESSIONS}>
                <defs>
                  <linearGradient id="fillSA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                <XAxis dataKey="day" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 12 }} />
                <Area type="monotone" dataKey={tab} stroke="#2563EB" strokeWidth={2.5} fill="url(#fillSA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <h2 className="text-[14.5px] font-bold mb-2" style={{ color: "#161B23" }}>Reservation status split</h2>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={RESERVATION_SPLIT} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {RESERVATION_SPLIT.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {RESERVATION_SPLIT.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2" style={{ color: "#6B7386" }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
                  </span>
                  <span className="font-semibold" style={{ color: "#161B23" }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>Cities</h2>
              {addingCity ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                    placeholder="City name"
                    autoFocus
                    className="px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none w-[130px]"
                    style={{ background: "#F8F9FC", border: "1px solid #E7EAF3", color: "#161B23" }}
                  />
                  <button onClick={handleAddCity} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#D1FAE5]" style={{ background: "#DCFCE7", cursor: "pointer" }}>
                    <Check size={12} style={{ color: "#16A34A" }} strokeWidth={3} />
                  </button>
                  <button onClick={() => { setAddingCity(false); setCityName(""); }} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#FEE2E2]" style={{ background: "#FEE2E2", cursor: "pointer" }}>
                    <X size={12} style={{ color: "#DC2626" }} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAddingCity(true)} className="flex items-center gap-1 text-[12.5px] font-semibold transition-colors hover:text-[#1D4ED8]" style={{ color: "#2563EB", cursor: "pointer" }}>
                  <Plus size={13} /> Add city
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-[1.3fr_1.3fr_0.6fr_0.7fr_0.3fr] text-[11px] font-semibold px-3 pb-2" style={{ color: "#A5ABB9" }}>
                <span>CITY</span><span>MANAGER</span><span>BOARDS</span><span>STATUS</span><span></span>
              </div>
              {filteredCities.map((c) => (
                <div key={c.name} className="grid grid-cols-[1.3fr_1.3fr_0.6fr_0.7fr_0.3fr] items-center px-3 py-3 rounded-xl text-[13px]" style={{ color: "#2A303C" }}>
                  <span className="font-medium">{c.name}</span>
                  <span style={{ color: "#8B93A7" }}>{c.manager}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8B93A7" }}>{c.active}/{c.boards}</span>
                  <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: c.status === "healthy" ? "#16A34A" : "#D97706" }}>
                    <StatusDot status={c.status} />
                    {c.status === "healthy" ? "Healthy" : "Attention"}
                  </span>
                  <ChevronRight size={14} style={{ color: "#C4C9D4" }} />
                </div>
              ))}
              {filteredCities.length === 0 && (
                <div className="px-3 py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>No cities match your search.</div>
              )}
            </div>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <h2 className="text-[14.5px] font-bold mb-4" style={{ color: "#161B23" }}>Latest reservations</h2>
            <div className="flex flex-col gap-3.5">
              {filteredReservations.map((r, i) => (
                <div key={i} className="flex flex-col gap-1 pb-3" style={{ borderBottom: i < filteredReservations.length - 1 ? "1px solid #F1F3F9" : "none" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold" style={{ color: "#161B23" }}>{r.advertiser}</span>
                    <ResStatus status={r.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#8B93A7" }}>{r.board}</span>
                    <span className="text-[11px]" style={{ color: "#A5ABB9" }}>{r.time}</span>
                  </div>
                </div>
              ))}
              {filteredReservations.length === 0 && (
                <div className="py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>No reservations match your search.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
