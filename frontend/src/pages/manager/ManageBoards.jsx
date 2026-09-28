import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [form, setForm] = useState({ name: '', location: '' });
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user.city) {
      setError('You are not assigned to a city yet. Ask your Super Admin to assign you to a city first.');
      return;
    }
    try {
      await api.post('/boards', { ...form, city: user.city });
      setForm({ name: '', location: '' });
      loadBoards();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board');
    }
  };

  const handleStatusToggle = async (board) => {
    const newStatus = board.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/boards/${board._id}`, { status: newStatus });
      loadBoards();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update board');
    }
  };

  const visibleBoards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.location || '').toLowerCase().includes(q)
    );
  }, [boards, query]);

  const columns = [
    { key: 'name', label: 'Board' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Link to={`/manager/timeslots/${row._id}`} className="text-[13px] font-medium text-signal hover:underline">
            Manage Timeslots
          </Link>
          <Button variant="secondary" size="sm" onClick={() => handleStatusToggle(row)}>
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Boards"
        subtitle={`Boards in your city${user.city ? '' : ' — not assigned yet'}.`}
      />

      {error && <Alert>{error}</Alert>}

      <Card title="Add a board" className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Board name"
              name="name"
              placeholder="e.g. Clock Tower Billboard"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="Location"
              name="location"
              placeholder="e.g. Main Street, Jaffna"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit">Add Board</Button>
        </form>
      </Card>

      {loading ? (
        <Loading label="Loading boards..." />
      ) : (
        <>
          <div className="mb-4 flex w-full sm:w-72">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search boards by name or location..."
            />
          </div>
          <Table
            columns={columns}
            rows={visibleBoards}
            emptyMessage={query ? 'No boards match your search.' : 'No boards in your city yet.'}
          />
        </>
      )}
    </div>
  );
}
