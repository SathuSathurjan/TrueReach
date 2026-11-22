// frontend/src/pages/Landing.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

// Set VITE_API_URL in frontend/.env if your backend is not on port 5000
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ---------- small hook: animate a number from 0 to its value ---------- */
function useCountUp(target, ms = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / ms, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/* ---------- live stats from GET /api/public/stats ---------- */
function useLiveStats() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${API}/public/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);
  return { stats, failed };
}

function Stat({ label, value, failed }) {
  const shown = useCountUp(value);
  return (
    <div className="stat">
      <div className="stat-num">{failed ? "–" : value == null ? "…" : shown.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ---------- content ---------- */
const STEPS = [
  { t: "Browse boards", d: "Pick a city and a board. See which time slots are free." },
  { t: "Book a slot", d: "Reserve a free slot. Overlapping bookings are rejected instantly." },
  { t: "Get approved", d: "Upload your ad. The city manager reviews and approves it." },
  { t: "See your reach", d: "After your slot runs, see how many people and vehicles passed the board." },
];

const ROLES = {
  "Super Admin": [
    "Create cities and assign city managers",
    "Register boards and manage every advertiser",
    "See all reservations across the network",
    "Compare impressions between cities",
  ],
  "City Manager": [
    "Manage the boards in your own city",
    "Set which time slots are open for booking",
    "Approve or reject ad creatives",
    "Review impression reports for your city",
  ],
  Advertiser: [
    "Browse boards and book free time slots",
    "Upload ad creatives and track approval",
    "Manage all of your reservations",
    "See people and vehicle counts for each campaign",
  ],
};

/* ---------- hero illustration: what the camera "sees" ---------- */
function DetectionScene() {
  return (
    <svg viewBox="0 0 480 300" role="img" aria-label="Illustration of a camera view with people and vehicles being counted" className="scene">
      <rect width="480" height="300" rx="10" fill="var(--panel)" />
      <rect y="170" width="480" height="130" fill="#0E1428" />
      <g stroke="var(--line)" strokeWidth="2" strokeDasharray="18 14">
        <line x1="0" y1="235" x2="480" y2="235" />
      </g>
      {/* buildings */}
      <g fill="#161F3A">
        <rect x="20" y="70" width="70" height="100" />
        <rect x="100" y="100" width="55" height="70" />
        <rect x="330" y="60" width="80" height="110" />
        <rect x="420" y="95" width="50" height="75" />
      </g>
      {/* car */}
      <rect x="60" y="205" width="110" height="40" rx="8" fill="#2A3558" />
      <rect x="55" y="198" width="120" height="54" fill="none" stroke="var(--amber)" strokeWidth="2" />
      <rect x="55" y="182" width="62" height="16" fill="var(--amber)" />
      <text x="60" y="194" fontSize="11" fontWeight="600" fill="#1a1200">car 0.93</text>
      {/* bus */}
      <rect x="250" y="190" width="150" height="55" rx="6" fill="#2A3558" />
      <rect x="245" y="184" width="160" height="68" fill="none" stroke="var(--amber)" strokeWidth="2" />
      <rect x="245" y="168" width="68" height="16" fill="var(--amber)" />
      <text x="250" y="180" fontSize="11" fontWeight="600" fill="#1a1200">bus 0.89</text>
      {/* people */}
      <g fill="#34406A">
        <rect x="195" y="140" width="14" height="44" rx="6" />
        <circle cx="202" cy="132" r="8" />
        <rect x="430" y="150" width="14" height="40" rx="6" />
        <circle cx="437" cy="142" r="8" />
      </g>
      <rect x="187" y="122" width="30" height="66" fill="none" stroke="var(--teal)" strokeWidth="2" />
      <rect x="187" y="106" width="64" height="16" fill="var(--teal)" />
      <text x="191" y="118" fontSize="11" fontWeight="600" fill="#04211d">person 0.91</text>
      <rect x="422" y="132" width="30" height="62" fill="none" stroke="var(--teal)" strokeWidth="2" />
      <rect x="388" y="116" width="64" height="16" fill="var(--teal)" />
      <text x="392" y="128" fontSize="11" fontWeight="600" fill="#04211d">person 0.87</text>
    </svg>
  );
}

export default function Landing() {
  const { stats, failed } = useLiveStats();
  const [role, setRole] = useState("Advertiser");

  return (
    <div className="lp">
      {/* ---------- top bar ---------- */}
      <header className="nav">
        <a className="brand" href="#top">TrueReach</a>
        <nav className="nav-links" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#roles">Who it's for</a>
          <a href="#tracking">Audience tracking</a>
        </nav>
        <div className="nav-cta">
          <Link className="btn ghost" to="/login">Log in</Link>
          <Link className="btn solid" to="/register">Create account</Link>
        </div>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero">
          <div className="hero-text">
            <h1>Book digital boards. See who actually saw your ad.</h1>
            <p className="lead">
              TrueReach manages advertising boards across cities and counts the people and
              vehicles that pass each board during your booked slot.
            </p>
            <div className="hero-actions">
              <Link className="btn solid big" to="/register">Create an advertiser account</Link>
              <a className="btn ghost big" href="#how">See how it works</a>
            </div>
          </div>
          <figure className="hero-figure">
            <DetectionScene />
            <figcaption>The camera counts people and vehicles. No video is stored.</figcaption>
          </figure>
        </section>

        {/* ---------- live numbers ---------- */}
        <section className="stats" aria-label="Network totals">
          <Stat label="Cities" value={stats?.cities} failed={failed} />
          <Stat label="Active boards" value={stats?.boards} failed={failed} />
          <Stat label="People counted" value={stats?.people} failed={failed} />
          <Stat label="Vehicles counted" value={stats?.vehicles} failed={failed} />
          {failed && <p className="stats-note">Live numbers are unavailable. Check that the backend is running.</p>}
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="block">
          <h2>From booking to proof of reach in four steps</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="step-n">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- roles ---------- */}
        <section id="roles" className="block">
          <h2>One platform, three levels of access</h2>
          <div className="tabs" role="tablist" aria-label="User roles">
            {Object.keys(ROLES).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={role === r}
                className={role === r ? "tab active" : "tab"}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <ul className="role-list" role="tabpanel">
            {ROLES[role].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* ---------- tracking + privacy ---------- */}
        <section id="tracking" className="block split">
          <div>
            <h2>Reach you can check, not estimate</h2>
            <p>
              A camera at the board is analysed by an object-detection model. It counts people,
              cars, motorcycles, buses and trucks, and sends the totals every 30 seconds.
              Each total is saved against your reservation, so your report shows the exact
              slot you paid for.
            </p>
          </div>
          <div className="privacy">
            <h3>Privacy by design</h3>
            <p>
              Video is processed on the spot and never stored or sent. Only numbers leave the
              camera: how many people and how many vehicles.
            </p>
          </div>
        </section>

        {/* ---------- closing call to action ---------- */}
        <section className="cta">
          <h2>Ready to book your first slot?</h2>
          <div className="hero-actions center">
            <Link className="btn solid big" to="/register">Create account</Link>
            <Link className="btn ghost big" to="/login">Log in</Link>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>TrueReach</span>
        <span>Final year project, Thavarasa Sathurjan</span>
      </footer>
    </div>
  );
}
