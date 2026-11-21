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

const videoExtensions = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v']);
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

function toDatetimeLocal(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function AdCreative({ url }) {
  if (!url) return <span className="text-sm text-gray-400">No ad creative</span>;

  const filePath = url.split(/[?#]/)[0];
  const extension = filePath.split('.').pop()?.toLowerCase();

  if (videoExtensions.has(extension)) {
    return (
      <video className="w-full max-w-xs rounded-lg" controls preload="metadata" src={url}>
        Your browser does not support video playback.
      </video>
    );
  }

  if (imageExtensions.has(extension)) {
    return <img className="w-full max-w-xs rounded-lg" src={url} alt="Booked ad creative" />;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-signal hover:underline">
      Open ad creative
    </a>
  );
}

export default function ManageTimeslots({ adminMode = false }) {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [editingSlot, setEditingSlot] = useState(null);
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

  const beginEdit = (slot) => {
    setError('');
    setEditingSlot({
      id: slot._id,
      startTime: toDatetimeLocal(slot.startTime),
      endTime: toDatetimeLocal(slot.endTime),
    });
  };

  const handleEditChange = (e) => {
    setEditingSlot({ ...editingSlot, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/timeslots/${editingSlot.id}`, {
        startTime: new Date(editingSlot.startTime).toISOString(),
        endTime: new Date(editingSlot.endTime).toISOString(),
      });
      setEditingSlot(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update timeslot');
    }
  };

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
    setError('');
    try {
      await api.delete(`/timeslots/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete this timeslot');
    }
  };

  const handleAvailabilityToggle = async (slot) => {
    setError('');
    const status = slot.status === 'unavailable' ? 'available' : 'unavailable';
    try {
      await api.put(`/timeslots/${slot._id}`, { status });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update timeslot availability');
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
      key: 'reservation',
      label: 'Booking details',
      render: (row) => {
        if (row.status !== 'booked') return <span className="text-gray-400">—</span>;
        if (!row.reservation) return <span className="text-gray-400">Booking details unavailable</span>;

        return (
          <div className="space-y-2">
            <div>
              <p className="font-medium text-ink">
                {row.reservation.advertiser?.name || 'Unknown advertiser'}
              </p>
              {row.reservation.advertiser?.email && (
                <p className="text-xs text-gray-500">{row.reservation.advertiser.email}</p>
              )}
            </div>
            <AdCreative url={row.reservation.adCreativeUrl} />
          </div>
        );
      },
      searchValue: (row) => row.reservation?.advertiser?.name || '',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => beginEdit(row)}>
            Edit time
          </Button>
          {row.status === 'booked' ? (
            <Button variant="danger" size="sm" onClick={() => handleAvailabilityToggle(row)}>
              Cancel booking &amp; mark unavailable
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => handleAvailabilityToggle(row)}>
                {row.status === 'available' ? 'Mark unavailable' : 'Make available'}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(row._id)}>
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Link
        to={adminMode ? '/admin/boards' : '/manager/boards'}
        className="mb-4 inline-block text-[13px] font-medium text-signal hover:underline"
      >
        {adminMode ? '← Back to Manage Boards' : '← Back to My Boards'}
      </Link>
      <PageHeader
        title={`Timeslots — ${board?.name || '...'}`}
        subtitle={board?.location}
      />

      {error && <Alert>{error}</Alert>}

      {editingSlot && (
        <Card title="Edit timeslot" className="mb-6">
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Start"
                type="datetime-local"
                name="startTime"
                value={editingSlot.startTime}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="flex-1">
              <Input
                label="End"
                type="datetime-local"
                name="endTime"
                value={editingSlot.endTime}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save time</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingSlot(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

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
