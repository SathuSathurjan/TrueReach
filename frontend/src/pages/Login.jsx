import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const roleHomePage = {
  superadmin: '/admin',
  citymanager: '/manager',
  advertiser: '/advertiser',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(roleHomePage[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: '#EFF2F8', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-8"
        style={{ border: '1px solid #E7EAF3', boxShadow: '0 24px 50px -24px rgba(15,23,42,0.25)' }}
      >
        <div className="mb-7 flex items-center gap-2.5">
          <img src="/truereach_logo.png" alt="TrueReach" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-lg font-bold" style={{ color: '#161B23' }}>
            TrueReach
          </span>
        </div>

        <h1 className="font-display text-[19px] font-bold" style={{ color: '#161B23' }}>
          Sign in
        </h1>
        <p className="mb-6 mt-1 text-[12.5px]" style={{ color: '#8B93A7' }}>
          Manage your advertising boards and campaigns.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px]" style={{ color: '#8B93A7' }}>
          New advertiser?{' '}
          <Link to="/register" className="font-semibold text-signal hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
