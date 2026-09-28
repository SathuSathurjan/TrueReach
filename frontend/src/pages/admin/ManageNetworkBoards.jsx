import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageNetworkBoards() {
  const [boards, setBoards] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', location: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [boardRes, cityRes] = await Promise.all([api.get('/boards'), api.get('/cities')]);
      setBoards(boardRes.data);
      setCities(cityRes.data);
      if (cityRes.data.length > 0) {
        setForm((f) => ({ ...f, city: f.city || cityRes.data[0]._id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cityById = useMemo(
    () => new Map(cities.map((c) => [c._id, c])),
    [cities]
  );

  const visibleBoards = useMemo(() => {
    const byCity = cityFilter ? boards.filter((b) => b.city?._id === cityFilter) : boards;
    const q = query.trim().toLowerCase();
    if (!q) return byCity;
    return byCity.filter((b) => {
      const manager = cityById.get(b.city?._id)?.cityManager?.name || '';
      return (
        b.name.toLowerCase().includes(q) ||
        (b.location || '').toLowerCase().includes(q) ||
        (cityById.get(b.city?._id)?.name || '').toLowerCase().includes(q) ||
        manager.toLowerCase().includes(q)
      );
    });
  }, [boards, cityFilter, query, cityById]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.city) {
      setError('Please select a city first');
      return;
    }
    try {
      await api.post('/boards', { name: form.name, location: form.location, city: form.city });
      setForm({ name: '', location: '', city: form.city });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board');
    }
  };

  const handleStatusToggle = async (board) => {
    const newStatus = board.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/boards/${board._id}`, { status: newStatus });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update board');
    }
  };

  const cityOptions = [
    { value: '', label: 'All cities' },
    ...cities.map((c) => ({ value: c._id, label: c.name })),
  ];

  const columns = [
    { key: 'name', label: 'Board' },
    { key: 'location', label: 'Location' },
    {
      key: 'city',
      label: 'City',
      render: (row) => cityById.get(row.city?._id)?.name || '—',
    },
    {
      key: 'manager',
      label: 'City Manager',
      render: (row) => {
        const manager = cityById.get(row.city?._id)?.cityManager;
        return manager ? manager.name : '— Unassigned —';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
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
        title="Manage Boards"
        subtitle="Every board across the network, filterable by city."
      />

      {error && <Alert>{error}</Alert>}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card title="Add a board" className="flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Input
                label="Board name"
                name="name"
                placeholder="e.g. Hospital Road Hoarding"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex-1">
              <Input
                label="Location"
                name="location"
                placeholder="e.g. Hospital Road, Jaffna"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                label="City"
                name="city"
                value={form.city}
                options={cities.map((c) => ({ value: c._id, label: c.name }))}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit">Add Board</Button>
          </form>
        </Card>

        <div className="w-full lg:w-56 space-y-4">
          <Select
            label="Filter by city"
            value={cityFilter}
            options={cityOptions}
            onChange={(e) => setCityFilter(e.target.value)}
          />
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search boards..."
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading boards..." />
      ) : (
        <Table
          columns={columns}
          rows={visibleBoards}
          emptyMessage={query ? 'No boards match your search.' : 'No boards found for this filter.'}
        />
      )}
    </div>
  );
}
