import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageCities() {
  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cityRes, managerRes] = await Promise.all([
        api.get('/cities'),
        api.get('/users', { params: { role: 'citymanager' } }),
      ]);
      setCities(cityRes.data);
      setManagers(managerRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/cities', { name });
      setName('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create city');
    }
  };

  const handleAssignManager = async (cityId, managerId) => {
    try {
      await api.put(`/cities/${cityId}`, { cityManager: managerId || null });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign manager');
    }
  };

  const handleStatusToggle = async (city) => {
    const newStatus = city.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/cities/${city._id}`, { status: newStatus });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const managerOptions = [
    { value: '', label: '— Unassigned —' },
    ...managers.map((m) => ({ value: m._id, label: m.name })),
  ];

  const visibleCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cityManager?.name || '').toLowerCase().includes(q)
    );
  }, [cities, query]);

  const columns = [
    { key: 'name', label: 'City' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'manager',
      label: 'City Manager',
      render: (row) => (
        <Select
          value={row.cityManager?._id || ''}
          options={managerOptions}
          onChange={(e) => handleAssignManager(row._id, e.target.value)}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => handleStatusToggle(row)}>
          {row.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Cities"
        subtitle="Add cities and assign a city manager to each."
      />

      {error && <Alert>{error}</Alert>}

      <Card title="Add a new city" className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="City name"
              placeholder="e.g. Jaffna"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Add City</Button>
        </form>
      </Card>

      {loading ? (
        <Loading label="Loading cities..." />
      ) : (
        <>
          <div className="mb-4 flex w-full sm:w-72">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search cities or managers..."
            />
          </div>
          <Table
            columns={columns}
            rows={visibleCities}
            emptyMessage={query ? 'No cities match your search.' : 'No cities yet. Add your first city above.'}
          />
        </>
      )}
    </div>
  );
}
