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

// @route  POST /api/timeslots   (superadmin: any board | citymanager: own city's boards)
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

    const timeslots = await Timeslot.find(filter).populate('board', 'name location city');
    res.json(timeslots);
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

    if (timeslot.status === 'booked') {
      return res.status(400).json({ message: 'Cannot edit a timeslot that is already booked' });
    }

    const { startTime, endTime } = req.body;
    const start = startTime ? new Date(startTime) : timeslot.startTime;
    const end = endTime ? new Date(endTime) : timeslot.endTime;

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
