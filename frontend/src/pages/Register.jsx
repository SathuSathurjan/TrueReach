import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'advertiser' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      if (user.status === 'pending') {
        setPendingApproval(true);
      } else {
        navigate('/advertiser');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          {pendingApproval ? 'Request submitted' : 'Create an account'}
        </h1>
        <p className="mb-6 mt-1 text-[12.5px]" style={{ color: '#8B93A7' }}>
          {pendingApproval
            ? 'Your city manager account will be available after an admin approves your request.'
            : form.role === 'citymanager'
              ? 'Request access to manage city advertising inventory.'
              : 'Book board time and track your campaign reach.'}
        </p>

        {pendingApproval ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Your request is pending. You can sign in once an admin approves your account.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Account type"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: 'advertiser', label: 'Advertiser' },
                { value: 'citymanager', label: 'City Manager' },
              ]}
            />
            <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating account...' : form.role === 'citymanager' ? 'Request account' : 'Create account'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-[13px]" style={{ color: '#8B93A7' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
