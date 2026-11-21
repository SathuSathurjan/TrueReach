import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function BookSlot() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [slots, setSlots] = useState([]);
  const [adCreative, setAdCreative] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const loadData = async () => {
    try {
      const [boardRes, slotsRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get('/timeslots', { params: { board: boardId, status: 'available' } }),
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

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setBooking(true);
    try {
      const formData = new FormData();
      formData.append('timeslot', selectedSlot);
      if (adCreative) {
        formData.append('adCreative', adCreative);
      }
      await api.post('/reservations', formData);
      navigate('/advertiser/reservations');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed — this slot may have just been taken');
      loadData();
    } finally {
      setBooking(false);
    }
  };

  return (
    <div>
      <Link to="/advertiser/boards" className="mb-4 inline-block text-[13px] font-medium text-signal hover:underline">
        ← Back to Browse Boards
      </Link>
      <PageHeader title={`Available Slots — ${board?.name || '...'}`} subtitle={board?.location} />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading slots..." />
      ) : (
        <form onSubmit={handleBook}>
          <Card title="Select a time slot" className="mb-6">
            {slots.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No available slots for this board right now.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {slots.map((s) => (
                  <label
                    key={s._id}
                    className={`flex cursor-pointer items-center gap-4 rounded px-3 py-4 transition-colors
                      ${selectedSlot === s._id ? 'bg-signal-light' : 'hover:bg-canvas'}`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={s._id}
                      checked={selectedSlot === s._id}
                      onChange={() => setSelectedSlot(s._id)}
                      className="accent-signal"
                    />
                    <span className="flex-1 text-sm text-ink">
                      <span className="font-medium">{new Date(s.startTime).toLocaleString()}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span>{new Date(s.endTime).toLocaleString()}</span>
                    </span>
                    <span className="rounded-md bg-success-light px-2 py-1 text-[11px] font-semibold text-success">
                      Available
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>

          {slots.length > 0 && (
            <Card title="Ad creative">
              <div className="flex flex-col gap-4">
                <Input
                  label="Upload ad video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setAdCreative(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Upload a video file for your ad. The city manager will review it before approval.
                </p>
                <div>
                  <Button type="submit" disabled={!selectedSlot || booking}>
                    {booking ? 'Booking...' : 'Book Selected Slot'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      )}
    </div>
  );
}
