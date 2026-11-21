const Timeslot = require('../models/Timeslot');
const Board = require('../models/Board');
const City = require('../models/City');
const Reservation = require('../models/Reservation');

// Helper: checks whether a citymanager owns the city that a board belongs to
const managerOwnsBoard = async (userId, boardId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  const city = await City.findById(board.city);
  return city && city.cityManager && city.cityManager.toString() === userId;
};

// Helper: checks if a new [startTime, endTime] range overlaps any existing
// timeslot on the same board. Two ranges overlap if start1 < end2 AND end1 > start2.
const hasOverlap = async (boardId, startTime, endTime, excludeTimeslotId = null) => {
  const query = {
    board: boardId,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeTimeslotId) {
    query._id = { $ne: excludeTimeslotId };
  }
  const conflict = await Timeslot.findOne(query);
  return !!conflict;
};

// @route  POST /api/timeslots   (superadmin, or citymanager: own city's boards)
exports.createTimeslot = async (req, res) => {
  try {
    const { board, startTime, endTime } = req.body;

    if (!board || !startTime || !endTime) {
      return res.status(400).json({ message: 'board, startTime and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    const boardDoc = await Board.findById(board);
    if (!boardDoc) return res.status(404).json({ message: 'Board not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, board);
      if (!owns) return res.status(403).json({ message: 'You do not manage this board' });
    }

    // Conflict-free scheduling: reject overlapping slots on the same board
    const conflict = await hasOverlap(board, start, end);
    if (conflict) {
      return res.status(409).json({ message: 'This timeslot overlaps with an existing slot on this board' });
    }

    const timeslot = await Timeslot.create({ board, startTime: start, endTime: end });
    res.status(201).json(timeslot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/timeslots?board=BOARD_ID
// Returns all timeslots for a board. Advertisers typically filter by board when browsing.
exports.getTimeslots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.board) filter.board = req.query.board;
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === 'citymanager') {
      if (req.query.board) {
        const owns = await managerOwnsBoard(req.user.id, req.query.board);
        if (!owns) return res.status(403).json({ message: 'Access denied' });
      } else {
        const city = await City.findOne({ cityManager: req.user.id });
        if (!city) return res.json([]);
        filter.board = { $in: await Board.find({ city: city._id }).distinct('_id') };
      }
    }

    const timeslots = await Timeslot.find(filter).populate('board', 'name location city');

    if (!['superadmin', 'citymanager'].includes(req.user.role)) {
      return res.json(timeslots);
    }

    const reservations = await Reservation.find({
      timeslot: { $in: timeslots.map((timeslot) => timeslot._id) },
      status: { $in: ['pending', 'approved'] },
    })
      .populate('advertiser', 'name email')
      .select('timeslot advertiser adCreativeUrl status')
      .sort({ createdAt: -1 });
    const reservationByTimeslot = new Map(
      reservations.map((reservation) => [reservation.timeslot.toString(), reservation])
    );

    res.json(timeslots.map((timeslot) => ({
      ...timeslot.toObject(),
      reservation: reservationByTimeslot.get(timeslot._id.toString()) || null,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/timeslots/:id
exports.getTimeslotById = async (req, res) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id).populate('board', 'name location city');
    if (!timeslot) return res.status(404).json({ message: 'Timeslot not found' });
    res.json(timeslot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/timeslots/:id   (superadmin, or citymanager who owns the board)
exports.updateTimeslot = async (req, res) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id);
    if (!timeslot) return res.status(404).json({ message: 'Timeslot not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, timeslot.board);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    const { startTime, endTime, status } = req.body;
    const cancelBooking = status === 'unavailable' && timeslot.status === 'booked';
    if (status !== undefined) {
      if (timeslot.status === 'booked' && status !== 'unavailable') {
        return res.status(400).json({ message: 'A booked timeslot can only be marked unavailable' });
      }
      if (!['available', 'unavailable'].includes(status)) {
        return res.status(400).json({ message: 'Status must be available or unavailable' });
      }
      timeslot.status = status;
    }

    const start = startTime ? new Date(startTime) : timeslot.startTime;
    const end = endTime ? new Date(endTime) : timeslot.endTime;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Valid startTime and endTime are required' });
    }
    if (start >= end) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    const conflict = await hasOverlap(timeslot.board, start, end, timeslot._id);
    if (conflict) {
      return res.status(409).json({ message: 'Updated time overlaps with another slot' });
    }

    timeslot.startTime = start;
    timeslot.endTime = end;
    await timeslot.save();

    if (cancelBooking) {
      try {
        await Reservation.updateMany(
          { timeslot: timeslot._id, status: { $in: ['pending', 'approved'] } },
          { status: 'rejected' }
        );
      } catch (err) {
        timeslot.status = 'booked';
        await timeslot.save();
        throw err;
      }
    }

    res.json(timeslot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/timeslots/:id   (superadmin, or citymanager who owns the board)
exports.deleteTimeslot = async (req, res) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id);
    if (!timeslot) return res.status(404).json({ message: 'Timeslot not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsBoard(req.user.id, timeslot.board);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    if (timeslot.status === 'booked') {
      return res.status(400).json({ message: 'Cannot delete a booked timeslot' });
    }

    await timeslot.deleteOne();
    res.json({ message: 'Timeslot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
