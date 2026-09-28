const Reservation = require('../models/Reservation');
const Timeslot = require('../models/Timeslot');
const Board = require('../models/Board');
const City = require('../models/City');

// Helper: checks whether a citymanager owns the city that a board belongs to
const managerOwnsBoard = async (userId, boardId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  const city = await City.findById(board.city);
  return city && city.cityManager && city.cityManager.toString() === userId;
};

// @route  POST /api/reservations   (advertiser only)
// Books a timeslot atomically — prevents two advertisers from booking the same slot.
exports.createReservation = async (req, res) => {
  try {
    const { timeslot, adCreativeUrl } = req.body;

    if (!timeslot) {
      return res.status(400).json({ message: 'timeslot is required' });
    }

    const slotDoc = await Timeslot.findById(timeslot);
    if (!slotDoc) return res.status(404).json({ message: 'Timeslot not found' });

    // Atomic claim: only succeeds if the slot is still 'available'.
    // If two requests race, only the first one flips this successfully.
    const claimedSlot = await Timeslot.findOneAndUpdate(
      { _id: timeslot, status: 'available' },
      { status: 'booked' },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ message: 'This timeslot has just been booked by someone else' });
    }

    try {
      const reservation = await Reservation.create({
        advertiser: req.user.id,
        board: slotDoc.board,
        timeslot,
        adCreativeUrl: adCreativeUrl || '',
        status: 'pending',
      });
      return res.status(201).json(reservation);
    } catch (createErr) {
      // Roll back the slot claim if reservation creation somehow fails
      await Timeslot.findByIdAndUpdate(timeslot, { status: 'available' });
      throw createErr;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: board populated with its city so list views can group/filter by city
const boardPopulate = {
  path: 'board',
  select: 'name location city',
  populate: { path: 'city', select: 'name' },
};

// @route  GET /api/reservations
// advertiser -> own reservations | citymanager -> reservations for boards in their city | superadmin -> all
exports.getReservations = async (req, res) => {
  try {
    let reservations;

    if (req.user.role === 'advertiser') {
      reservations = await Reservation.find({ advertiser: req.user.id })
        .populate(boardPopulate)
        .populate('timeslot', 'startTime endTime');
    } else if (req.user.role === 'citymanager') {
      const city = await City.findOne({ cityManager: req.user.id });
      if (!city) return res.json([]);
      const boards = await Board.find({ city: city._id }).select('_id');
      const boardIds = boards.map((b) => b._id);
      reservations = await Reservation.find({ board: { $in: boardIds } })
        .populate(boardPopulate)
        .populate('timeslot', 'startTime endTime')
        .populate('advertiser', 'name email');
    } else {
      // superadmin
      reservations = await Reservation.find()
        .populate(boardPopulate)
        .populate('timeslot', 'startTime endTime')
        .populate('advertiser', 'name email');
    }

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reservations/:id
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('board', 'name location city')
      .populate('timeslot', 'startTime endTime')
      .populate('advertiser', 'name email');

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role === 'advertiser' && reservation.advertiser._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, reservation.board._id);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reservations/:id/approve   (superadmin, or citymanager who owns the board)
exports.approveReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, reservation.board);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    reservation.status = 'approved';
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reservations/:id/reject   (superadmin, or citymanager who owns the board)
// Rejecting frees the timeslot back up for other advertisers.
exports.rejectReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, reservation.board);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    reservation.status = 'rejected';
    await reservation.save();

    // Free up the timeslot so other advertisers can book it
    await Timeslot.findByIdAndUpdate(reservation.timeslot, { status: 'available' });

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
