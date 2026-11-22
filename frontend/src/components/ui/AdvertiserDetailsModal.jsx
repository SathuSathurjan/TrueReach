import { useEffect } from 'react';
import { Mail, Phone, X } from 'lucide-react';
import Badge from './Badge';

export default function AdvertiserDetailsModal({ advertiser, reservations, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const counts = reservations.reduce((result, reservation) => {
    result[reservation.status] = (result[reservation.status] || 0) + 1;
    return result;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="advertiser-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-hairline p-5">
          <div>
            <h2 id="advertiser-details-title" className="text-lg font-bold text-ink">
              {advertiser.name || 'Advertiser details'}
            </h2>
            <p className="mt-1 text-sm text-secondary">Advertiser profile and bookings in your city</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close advertiser details"
            className="rounded-lg p-2 text-secondary hover:bg-[#F1F3F9]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Contact details</h3>
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-secondary">Personal email: {advertiser.email || 'Not provided'}</p>
              {advertiser.email && (
                <a
                  href={`mailto:${advertiser.email}`}
                  className="inline-flex items-center gap-2 text-signal hover:underline"
                >
                  <Mail size={15} />
                  Email advertiser
                </a>
              )}
              <p className="inline-flex items-center gap-2 text-secondary">
                <Phone size={15} />
                Personal mobile:
                {advertiser.phone
                  ? <a href={`tel:${advertiser.phone}`} className="text-signal hover:underline">{advertiser.phone}</a>
                  : 'Not provided'}
              </p>
              <p className="text-secondary">Company: {advertiser.companyName || 'Not provided'}</p>
              <p className="text-secondary">Company email: {advertiser.companyEmail || 'Not provided'}</p>
              {advertiser.companyEmail && (
                <a
                  href={`mailto:${advertiser.companyEmail}`}
                  className="inline-flex items-center gap-2 text-signal hover:underline"
                >
                  <Mail size={15} />
                  Email company
                </a>
              )}
              <p className="inline-flex items-center gap-2 text-secondary">
                <Phone size={15} />
                Company phone:
                {advertiser.companyPhone
                  ? <a href={`tel:${advertiser.companyPhone}`} className="text-signal hover:underline">{advertiser.companyPhone}</a>
                  : 'Not provided'}
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Booking activity</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Total', reservations.length],
                ['Approved', counts.approved || 0],
                ['Pending', counts.pending || 0],
                ['Rejected', counts.rejected || 0],
              ].map(([label, count]) => (
                <div key={label} className="rounded-xl bg-[#F8F9FC] p-3">
                  <p className="text-xs text-secondary">{label}</p>
                  <p className="mt-1 text-lg font-bold text-ink">{count}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Bookings in your city</h3>
            {reservations.length === 0 ? (
              <p className="text-sm text-secondary">No bookings found.</p>
            ) : (
              <div className="flex flex-col divide-y divide-hairline">
                {reservations.map((reservation) => (
                  <div
                    key={reservation._id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {reservation.board?.name || 'Board unavailable'}
                      </p>
                      <p className="mt-1 text-xs text-secondary">
                        {reservation.timeslot?.startTime
                          ? new Date(reservation.timeslot.startTime).toLocaleString()
                          : 'Time unavailable'}
                      </p>
                    </div>
                    <Badge status={reservation.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
