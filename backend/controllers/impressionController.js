const Impression = require('../models/Impression');
const Reservation = require('../models/Reservation');
const Board = require('../models/Board');
const City = require('../models/City');

const managerOwnsBoard = async (userId, boardId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  const city = await City.findById(board.city);
  return city && city.cityManager && city.cityManager.toString() === userId;
};

// @route  POST /api/impressions   (citymanager or superadmin — called by tracker.py)
exports.createImpression = async (req, res) => {
  try {
    const { board_id, timeslot_id, reservation_id, people_count, vehicle_count, timestamp } = req.body;

    if (!board_id || !timeslot_id || !reservation_id || people_count === undefined || vehicle_count === undefined) {
      return res.status(400).json({ message: 'board_id, timeslot_id, reservation_id, people_count, vehicle_count are required' });
    }

    const reservation = await Reservation.findById(reservation_id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (reservation.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot log impressions for a reservation that is not approved' });
    }

    if (
      reservation.board.toString() !== board_id ||
      reservation.timeslot.toString() !== timeslot_id
    ) {
      return res.status(400).json({ message: 'board_id/timeslot_id do not match this reservation' });
    }

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, board_id);
      if (!owns) return res.status(403).json({ message: 'You do not manage this board' });
    }

    const impression = await Impression.create({
      board: board_id,
      timeslot: timeslot_id,
      reservation: reservation_id,
      people_count,
      vehicle_count,
      recorded_at: timestamp ? new Date(timestamp) : Date.now(),
    });

    res.status(201).json(impression);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/impressions?reservation=ID&board=ID
// advertiser -> only impressions for their own reservations
// citymanager -> only impressions for boards in their city
// superadmin -> everything
exports.getImpressions = async (req, res) => {
  try {
    let filter = {};

    if (req.query.reservation) filter.reservation = req.query.reservation;
    if (req.query.board) filter.board = req.query.board;

    if (req.user.role === 'advertiser') {
      const myReservations = await Reservation.find({ advertiser: req.user.id }).select('_id');
      const myIds = myReservations.map((r) => r._id.toString());
      if (filter.reservation) {
        if (!myIds.includes(filter.reservation)) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        filter.reservation = { $in: myIds };
      }
    } else if (req.user.role === 'citymanager') {
      const city = await City.findOne({ cityManager: req.user.id });
      if (!city) return res.json([]);
      const boards = await Board.find({ city: city._id }).select('_id');
      const boardIds = boards.map((b) => b._id.toString());
      if (filter.board) {
        if (!boardIds.includes(filter.board)) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        filter.board = { $in: boardIds };
      }
    }
    // superadmin -> no extra restriction

    const impressions = await Impression.find(filter)
      .populate({ path: 'board', select: 'name location city', populate: { path: 'city', select: 'name' } })
      .sort({ recorded_at: -1 });

    res.json(impressions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/impressions/summary/:reservationId
// Aggregated totals for a campaign — used in advertiser & city manager reports
exports.getImpressionSummary = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role === 'advertiser' && reservation.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, reservation.board);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    const summary = await Impression.aggregate([
      { $match: { reservation: reservation._id } },
      {
        $group: {
          _id: '$reservation',
          totalPeople: { $sum: '$people_count' },
          totalVehicles: { $sum: '$vehicle_count' },
          dataPoints: { $sum: 1 },
          avgPeoplePerReading: { $avg: '$people_count' },
          avgVehiclesPerReading: { $avg: '$vehicle_count' },
        },
      },
    ]);

    res.json(summary[0] || {
      totalPeople: 0,
      totalVehicles: 0,
      dataPoints: 0,
      avgPeoplePerReading: 0,
      avgVehiclesPerReading: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
