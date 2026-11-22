import { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageCityManagers() {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingManagerId, setUpdatingManagerId] = useState(null);

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
      setForm({ name: '', email: '', phone: '', password: '' });
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

  const handleApprove = async (id) => {
    setError('');
    try {
      await api.put(`/users/${id}/approve`);
      loadManagers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve city manager');
    }
  };

  const handleStatusToggle = async (manager) => {
    const isActive = manager.isActive === false;
    if (!isActive && !window.confirm(
      `Deactivate ${manager.name}? They will be unassigned from their city and unable to sign in until reactivated.`
    )) return;

    setError('');
    setUpdatingManagerId(manager._id);
    try {
      await api.put(`/users/${manager._id}/status`, { isActive });
      await loadManagers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update city manager status');
    } finally {
      setUpdatingManagerId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'approval',
      label: 'Account status',
      render: (row) => (
        <Badge status={row.isApproved === false ? 'pending' : row.isActive === false ? 'inactive' : 'active'} />
      ),
    },
    {
      key: 'city',
      label: 'Assigned City',
      render: (row) => row.city?.name || '— Unassigned —',
      sortValue: (row) => row.city?.name || '',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          {row.isApproved === false && (
            <Button size="sm" onClick={() => handleApprove(row._id)}>
              Approve
            </Button>
          )}
          {row.isApproved !== false && (
            <Button
              variant={row.isActive === false ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusToggle(row)}
              disabled={updatingManagerId === row._id}
            >
              {row.isActive === false ? 'Reactivate' : 'Deactivate'}
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => handleDelete(row._id)} disabled={updatingManagerId === row._id}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="City Managers"
        subtitle="Create, approve, deactivate, and manage city manager accounts."
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
              label="Mobile number"
              type="tel"
              name="phone"
              value={form.phone}
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
        <Table columns={columns} rows={managers} emptyMessage="No city managers yet. Create one above." />
      )}
    </div>
  );
}
