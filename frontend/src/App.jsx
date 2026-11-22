// frontend/src/App.js
// Requires: npm install react-router-dom
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Temporary placeholders. We replace each one with the real page in later steps.
const Placeholder = ({ title }) => (
  <div style={{ padding: 40, fontFamily: "sans-serif" }}>
    <h2>{title}</h2>
    <p>Coming in a later step.</p>
    <Link to="/">Back to home</Link>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/*" element={<Placeholder title="Super Admin Dashboard" />} />
          <Route path="/manager/*" element={<Placeholder title="City Manager Dashboard" />} />
          <Route path="/advertiser/*" element={<Placeholder title="Advertiser Portal" />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
