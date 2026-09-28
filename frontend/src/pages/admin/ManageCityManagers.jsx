import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageCityManagers() {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadManagers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'citymanager' } });
      setManagers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load city managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', { ...form, role: 'citymanager' });
      setForm({ name: '', email: '', password: '' });
      loadManagers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create city manager');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this city manager?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadManagers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete city manager');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'city',
      label: 'Assigned City',
      render: (row) => row.city?.name || '— Unassigned —',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(row._id)}>
          Delete
        </Button>
      ),
    },
  ];

  const visibleManagers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.city?.name || '').toLowerCase().includes(q)
    );
  }, [managers, query]);

  return (
    <div>
      <PageHeader
        title="City Managers"
        subtitle="Create city manager accounts. Assign them to a city from the Manage Cities page."
      />

      {error && <Alert>{error}</Alert>}

      <Card title="Add a city manager" className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Name"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit">Add City Manager</Button>
        </form>
      </Card>

      {loading ? (
        <Loading label="Loading city managers..." />
      ) : (
        <>
          <div className="mb-4 flex w-full sm:w-72">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search managers by name or email..."
            />
          </div>
          <Table
            columns={columns}
            rows={visibleManagers}
            emptyMessage={query ? 'No city managers match your search.' : 'No city managers yet. Create one above.'}
          />
        </>
      )}
    </div>
  );
}
