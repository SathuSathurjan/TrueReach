import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageTimeslots() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [boardRes, slotsRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get('/timeslots', { params: { board: boardId } }),
      ]);
      setBoard(boardRes.data);
      setSlots(slotsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/timeslots', {
        board: boardId,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      setForm({ startTime: '', endTime: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create timeslot (check for overlap)');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/timeslots/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete this timeslot');
    }
  };

  const columns = [
    {
      key: 'start',
      label: 'Start',
      render: (row) => new Date(row.startTime).toLocaleString(),
      sortValue: (row) => row.startTime,
    },
    {
      key: 'end',
      label: 'End',
      render: (row) => new Date(row.endTime).toLocaleString(),
      sortValue: (row) => row.endTime,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.status === 'available' ? (
          <Button variant="danger" size="sm" onClick={() => handleDelete(row._id)}>
            Delete
          </Button>
        ) : (
          <span className="text-xs text-gray-400">Booked slots can't be removed</span>
        ),
    },
  ];

  return (
    <div>
      <Link to="/manager/boards" className="mb-4 inline-block text-[13px] font-medium text-signal hover:underline">
        ← Back to My Boards
      </Link>
      <PageHeader
        title={`Timeslots — ${board?.name || '...'}`}
        subtitle={board?.location}
      />

      {error && <Alert>{error}</Alert>}

      <Card title="Add a timeslot" className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Start"
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="End"
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit">Add Timeslot</Button>
        </form>
      </Card>

      {loading ? (
        <Loading label="Loading timeslots..." />
      ) : (
        <Table columns={columns} rows={slots} emptyMessage="No timeslots for this board yet." />
      )}
    </div>
  );
}
