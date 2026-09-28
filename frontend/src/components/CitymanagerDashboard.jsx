import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutGrid, MonitorPlay, CalendarClock, Users, ImagePlus, BarChart3,
  Search, Bell, Plus, Check, X, Clock, MapPin,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: MonitorPlay, label: "My Boards" },
  { icon: CalendarClock, label: "Time Slots" },
  { icon: Users, label: "Advertisers" },
  { icon: ImagePlus, label: "Ad Approvals" },
  { icon: BarChart3, label: "Reports" },
];

const INITIAL_BOARDS = [
  { name: "Galle Rd 04", location: "Colombo 03", status: "active", slotsToday: "6/8" },
  { name: "Union Pl 07", location: "Colombo 02", status: "active", slotsToday: "8/8" },
  { name: "Marine Dr 12", location: "Colombo 06", status: "idle", slotsToday: "2/8" },
  { name: "Duplication Rd 02", location: "Colombo 04", status: "active", slotsToday: "5/8" },
];

const INITIAL_APPROVALS = [
  { id: 1, advertiser: "Dilmah Tea", board: "Galle Rd 04", submitted: "10m ago" },
  { id: 2, advertiser: "Keells", board: "Union Pl 07", submitted: "42m ago" },
  { id: 3, advertiser: "Softlogic Mobile", board: "Marine Dr 12", submitted: "1h ago" },
];

const WEEKLY = [
  { day: "Mon", bookings: 5, capacity: 8 },
  { day: "Tue", bookings: 6, capacity: 8 },
  { day: "Wed", bookings: 7, capacity: 8 },
  { day: "Thu", bookings: 4, capacity: 8 },
  { day: "Fri", bookings: 8, capacity: 8 },
  { day: "Sat", bookings: 8, capacity: 8 },
  { day: "Sun", bookings: 6, capacity: 8 },
];

const APPROVAL_SPLIT = [
  { name: "Approved", value: 62, color: "#2563EB" },
  { name: "Pending", value: 24, color: "#22D3EE" },
  { name: "Rejected", value: 14, color: "#F4536A" },
];

function KPICard({ label, value, sub, icon: Icon, from, to }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden text-white"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
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

export default function CityManagerDashboard() {
  const [range, setRange] = useState("week");
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [boards, setBoards] = useState(INITIAL_BOARDS);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardLocation, setBoardLocation] = useState("");
  const [toast, setToast] = useState(null);

  const q = query.trim().toLowerCase();
  const filteredBoards = boards.filter(
    (b) => !q || b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q)
  );
  const filteredApprovals = approvals.filter(
    (a) => !q || a.advertiser.toLowerCase().includes(q) || a.board.toLowerCase().includes(q)
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddBoard = () => {
    if (!boardName.trim()) return;
    setBoards((prev) => [
      ...prev,
      { name: boardName.trim(), location: boardLocation.trim() || "Colombo —", status: "idle", slotsToday: "0/8" },
    ]);
    const added = boardName.trim();
    setBoardName("");
    setBoardLocation("");
    setAddingBoard(false);
    showToast(`Registered board "${added}"`);
  };

  const handleApproval = (id, action) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    showToast(`${action === "approved" ? "Approved" : "Rejected"} "${item.advertiser}"'s ad`);
  };

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
        userName="R. Fernando"
        userRole="City Manager · Colombo"
        initials="RF"
        gradient="linear-gradient(135deg,#2563EB,#22D3EE)"
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2563EB,#22D3EE)" }}>
              <LayoutGrid size={16} color="#fff" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold" style={{ color: "#161B23", fontFamily: "'Space Grotesk', sans-serif" }}>Colombo Dashboard</h1>
              <p className="text-[12.5px]" style={{ color: "#8B93A7" }}>4 boards under your management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8B93A7" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boards, advertisers"
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
          <KPICard label="Active Boards" value="4 / 4" sub="All boards online" icon={MonitorPlay} from="#2563EB" to="#3B82F6" />
          <KPICard label="Bookings This Week" value="44 / 56" sub="79% slot utilization" icon={CalendarClock} from="#06B6D4" to="#22D3EE" />
          <KPICard label="Pending Approvals" value={approvals.length} sub="Awaiting your review" icon={ImagePlus} from="#4F46E5" to="#818CF8" />
        </div>

        <div className="grid grid-cols-5 gap-5 mb-6">
          <div className="col-span-3 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>Weekly booking capacity</h2>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#F1F3F9" }}>
                {["week", "month"].map((k) => (
                  <button key={k} onClick={() => setRange(k)}
                    className="px-3 py-1 rounded-md text-[12px] font-medium capitalize cursor-pointer transition-colors"
                    style={{ background: range === k ? "#fff" : "transparent", color: range === k ? "#2563EB" : "#8B93A7", boxShadow: range === k ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                <XAxis dataKey="day" stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#B0B7C6" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 12 }} />
                <Bar dataKey="capacity" fill="#E7EEFB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <h2 className="text-[14.5px] font-bold mb-2" style={{ color: "#161B23" }}>Ad approval breakdown</h2>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={APPROVAL_SPLIT} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {APPROVAL_SPLIT.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {APPROVAL_SPLIT.map((s) => (
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
              <h2 className="text-[14.5px] font-bold" style={{ color: "#161B23" }}>My boards</h2>
              {addingBoard ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBoard()}
                    placeholder="Board name"
                    autoFocus
                    className="px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none w-[120px]"
                    style={{ background: "#F8F9FC", border: "1px solid #E7EAF3", color: "#161B23" }}
                  />
                  <input
                    value={boardLocation}
                    onChange={(e) => setBoardLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBoard()}
                    placeholder="Location"
                    className="px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none w-[110px]"
                    style={{ background: "#F8F9FC", border: "1px solid #E7EAF3", color: "#161B23" }}
                  />
                  <button onClick={handleAddBoard} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#D1FAE5]" style={{ background: "#DCFCE7", cursor: "pointer" }}>
                    <Check size={12} style={{ color: "#16A34A" }} strokeWidth={3} />
                  </button>
                  <button onClick={() => { setAddingBoard(false); setBoardName(""); setBoardLocation(""); }} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#FEE2E2]" style={{ background: "#FEE2E2", cursor: "pointer" }}>
                    <X size={12} style={{ color: "#DC2626" }} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAddingBoard(true)} className="flex items-center gap-1 text-[12.5px] font-semibold transition-colors hover:text-[#1D4ED8]" style={{ color: "#2563EB", cursor: "pointer" }}>
                  <Plus size={13} /> Register board
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-[1.3fr_1.3fr_0.7fr_0.6fr] text-[11px] font-semibold px-3 pb-2" style={{ color: "#A5ABB9" }}>
                <span>BOARD</span><span>LOCATION</span><span>STATUS</span><span>SLOTS</span>
              </div>
              {filteredBoards.map((b) => (
                <div key={b.name} className="grid grid-cols-[1.3fr_1.3fr_0.7fr_0.6fr] items-center px-3 py-3 rounded-xl text-[13px]" style={{ color: "#2A303C" }}>
                  <span className="font-medium">{b.name}</span>
                  <span className="flex items-center gap-1" style={{ color: "#8B93A7" }}><MapPin size={12} /> {b.location}</span>
                  <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: b.status === "active" ? "#16A34A" : "#F59E0B" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.status === "active" ? "#16A34A" : "#F59E0B" }} />
                    {b.status === "active" ? "Active" : "Idle"}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8B93A7" }}>{b.slotsToday}</span>
                </div>
              ))}
              {filteredBoards.length === 0 && (
                <div className="px-3 py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>No boards match your search.</div>
              )}
            </div>
          </div>

          <div className="col-span-2 rounded-2xl p-5 bg-white" style={{ border: "1px solid #E7EAF3" }}>
            <h2 className="text-[14.5px] font-bold mb-4" style={{ color: "#161B23" }}>Ad approval queue</h2>
            <div className="flex flex-col gap-3">
              {filteredApprovals.map((a) => (
                <div key={a.id} className="p-3 rounded-xl" style={{ background: "#F8F9FC" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: "#161B23" }}>{a.advertiser}</span>
                    <span className="text-[11px] flex items-center gap-1" style={{ color: "#A5ABB9" }}><Clock size={11} /> {a.submitted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#8B93A7" }}>{a.board}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApproval(a.id, "approved")} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#BBF7D0]" style={{ background: "#DCFCE7", cursor: "pointer" }}>
                        <Check size={12} style={{ color: "#16A34A" }} strokeWidth={3} />
                      </button>
                      <button onClick={() => handleApproval(a.id, "rejected")} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#FECACA]" style={{ background: "#FEE2E2", cursor: "pointer" }}>
                        <X size={12} style={{ color: "#DC2626" }} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredApprovals.length === 0 && (
                <div className="py-6 text-[12.5px] text-center" style={{ color: "#A5ABB9" }}>Approval queue is clear.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
