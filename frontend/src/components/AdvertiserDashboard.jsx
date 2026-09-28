import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutGrid, MonitorPlay, CalendarPlus, ClipboardList, BarChart3,
  Search, Bell, MapPin, Clock, CheckCircle2, XCircle, Eye, Car, ArrowUpRight,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: MonitorPlay, label: "Browse Boards" },
  { icon: CalendarPlus, label: "Book a Slot" },
  { icon: ClipboardList, label: "My Reservations" },
  { icon: BarChart3, label: "Impression Reports" },
];

const RESERVATIONS = [
  { board: "Colombo — Galle Rd 04", slot: "Aug 10, 6–8 PM", status: "approved" },
  { board: "Kandy — Peradeniya Rd 02", slot: "Aug 12, 8–10 AM", status: "pending" },
  { board: "Negombo — Beach Rd 01", slot: "Aug 14, 5–7 PM", status: "approved" },
  { board: "Colombo — Union Pl 07", slot: "Aug 15, 12–2 PM", status: "rejected" },
];

const ALL_BOARDS = [
  { name: "Galle Rd 04", city: "Colombo", nextSlot: "Today, 6 PM", price: "Rs 4,500 / slot" },
  { name: "Peradeniya Rd 02", city: "Kandy", nextSlot: "Tomorrow, 8 AM", price: "Rs 3,200 / slot" },
  { name: "Beach Rd 01", city: "Negombo", nextSlot: "Aug 12, 5 PM", price: "Rs 2,800 / slot" },
  { name: "Union Pl 07", city: "Colombo", nextSlot: "Aug 13, 12 PM", price: "Rs 4,200 / slot" },
  { name: "Marine Dr 12", city: "Colombo", nextSlot: "Aug 16, 7 PM", price: "Rs 5,100 / slot" },
  { name: "Fort Junction 03", city: "Galle", nextSlot: "Aug 18, 9 AM", price: "Rs 2,400 / slot" },
];

const IMPRESSIONS = [
  { day: "Mon", people: 1200, vehicles: 640 },
  { day: "Tue", people: 1450, vehicles: 700 },
  { day: "Wed", people: 1600, vehicles: 810 },
  { day: "Thu", people: 1380, vehicles: 690 },
  { day: "Fri", people: 2100, vehicles: 1040 },
  { day: "Sat", people: 2600, vehicles: 1320 },
  { day: "Sun", people: 2300, vehicles: 1180 },
];

const REACH_SPLIT = [
  { name: "Pedestrians", value: 68, color: "#2563EB" },
  { name: "Vehicles", value: 32, color: "#22D3EE" },
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

function StatusPill({ status }) {
  const map = {
    approved: { icon: CheckCircle2, bg: "#DCFCE7", color: "#16A34A", label: "Approved" },
    pending: { icon: Clock, bg: "#FEF3C7", color: "#D97706", label: "Pending" },
    rejected: { icon: XCircle, bg: "#FEE2E2", color: "#DC2626", label: "Rejected" },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-semibold" style={{ background: s.bg, color: s.color }}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

export default function AdvertiserDashboard() {
  const [tab, setTab] = useState("people");
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();
  const filteredBoards = ALL_BOARDS.filter(
    (b) => !q || b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)
  );
  const visibleBoards = showAll ? filteredBoards : filteredBoards.slice(0, 3);
  const filteredReservations = RESERVATIONS.filter(
    (r) => !q || r.board.toLowerCase().includes(q)
  );

  const handleLogout = () => {
    localStorage.removeItem("truereach_token");
    localStorage.removeItem("truereach_user");
    window.location.href = "/login";
  };

  return (
    <div className="w-full min-h-screen" style={{ background: "#EFF2F8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <DashboardSidebar
        navItems={NAV.map((n) => ({ ...n, active: activeNav === n.label }))}
        userName="Dilmah Tea"
        userRole="Advertiser"
        initials="DT"
        gradient="linear-gradient(135deg,#4F46E5,#22D3EE)"
        onSelect={setActiveNav}
        onLogout={handleLogout}
      />

      <main className="px-5 pb-8 pt-[68px] md:ml-[230px] md:px-8 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4F46E5,#22D3EE)" }}>
              <LayoutGrid size={16} color="#fff" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold" style={{ color: "#161B23", fontFamily: "'Space Grotesk', sans-serif" }}>Campaign Overview</h1>
              <p className="text-[12.5px]" style={{ color: "#8B93A7" }}>3 active bookings across 3 cities</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8B93A7" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boards by city"
                className="pl-9 pr-3 py-2 rounded-xl text-[13px] outline-none w-[220px] transition-colors"
                style={{ background: "#fff", border: "1px solid #E7EAF3", color: "#161B23" }}
              />
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors hover:bg-[#F0F4FF]" style={{ background: "#fff", border: "1px solid #E7EAF3", cursor: "pointer" }}>
              <Bell size={15} style={{ color: "#6B7386" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F4536A" }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <KPICard label="Active Reservations" value="3" sub="1 pending approval" icon={ClipboardList} from="#2563EB" to="#3B82F6" />
          <KPICard label="Total Impressions" value="14.2K" sub="Across all bookings this week" icon={Eye} from="#06B6D4" to="#22D3EE" />
          <KPICard label="Vehicle Reach" value="6.4K" sub="Verified vehicle count" icon={Car} from="#4F46E5" to="#818CF8" />
        </div>

        <div className="grid grid-cols-5 gap-5 mb-6">
          <div className="col-span-3 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>Verified impressions — last 7 days</h2>
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
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={IMPRESSIONS}>
                <defs>
                  <linearGradient id="fillAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                <XAxis dataKey="day" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 12 }} />
                <Area type="monotone" dataKey={tab} stroke="#2563EB" strokeWidth={2.5} fill="url(#fillAdv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <h2 className="text-[14.5px] font-bold mb-2" style={{ color: "#161B23" }}>Reach composition</h2>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={REACH_SPLIT} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {REACH_SPLIT.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {REACH_SPLIT.map((s) => (
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
            <h2 className="text-[14.5px] font-bold mb-4" style={{ color: "#161B23" }}>My reservations</h2>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-[1.6fr_1.2fr_0.7fr] text-[11px] font-semibold px-3 pb-2" style={{ color: "#A5ABB9" }}>
                <span>BOARD</span><span>SLOT</span><span>STATUS</span>
              </div>
              {filteredReservations.map((r, i) => (
                <div key={i} className="grid grid-cols-[1.6fr_1.2fr_0.7fr] items-center px-3 py-3 rounded-xl text-[13px]" style={{ color: "#2A303C" }}>
                  <span className="font-medium">{r.board}</span>
                  <span style={{ color: "#8B93A7" }}>{r.slot}</span>
                  <StatusPill status={r.status} />
                </div>
              ))}
              {filteredReservations.length === 0 && (
                <div className="py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>No reservations match your search.</div>
              )}
            </div>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>Browse boards</h2>
              <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 text-[12.5px] font-semibold transition-colors hover:text-[#1D4ED8]" style={{ color: "#2563EB", cursor: "pointer" }}>
                {showAll ? "Show less" : "View all"} <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {visibleBoards.map((b, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: "#F8F9FC" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: "#161B23" }}>{b.name}</span>
                    <span className="text-[11.5px] font-semibold" style={{ color: "#2563EB" }}>{b.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] flex items-center gap-1" style={{ color: "#8B93A7" }}><MapPin size={11} /> {b.city}</span>
                    <span className="text-[11.5px]" style={{ color: "#A5ABB9" }}>Next: {b.nextSlot}</span>
                  </div>
                </div>
              ))}
              {visibleBoards.length === 0 && (
                <div className="py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>No boards match your search.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
