const Board = require('../models/Board');
const City = require('../models/City');

// Helper: checks whether a citymanager owns the given city
const managerOwnsCity = async (userId, cityId) => {
  const city = await City.findById(cityId);
  return city && city.cityManager && city.cityManager.toString() === userId;
};

// @route  POST /api/boards   (superadmin: any city | citymanager: own city only)
exports.createBoard = async (req, res) => {
  try {
    const { name, location, city, status } = req.body;

    if (!name || !location || !city) {
      return res.status(400).json({ message: 'name, location and city are required' });
    }

    const cityDoc = await City.findById(city);
    if (!cityDoc) return res.status(404).json({ message: 'City not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsCity(req.user.id, city);
      if (!owns) {
        return res.status(403).json({ message: 'You can only add boards to your own city' });
      }
    }

    const board = await Board.create({ name, location, city, status });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/boards
// superadmin -> all boards | citymanager -> boards in their city | advertiser -> active boards only
exports.getBoards = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'citymanager') {
      const city = await City.findOne({ cityManager: req.user.id });
      if (!city) return res.json([]); // no city assigned yet
      filter.city = city._id;
    } else if (req.user.role === 'advertiser') {
      filter.status = 'active';
    }
    // superadmin -> no filter, sees everything

    const boards = await Board.find(filter).populate('city', 'name status');
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/boards/:id
exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('city', 'name status cityManager');
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsCity(req.user.id, board.city._id);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/boards/:id   (superadmin, or citymanager who owns the board's city)
exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsCity(req.user.id, board.city);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    const { name, location, status } = req.body;
    if (name) board.name = name;
    if (location) board.location = location;
    if (status) board.status = status;

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/boards/:id   (superadmin, or citymanager who owns the board's city)
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (req.user.role === 'citymanager') {
      const owns = await managerOwnsCity(req.user.id, board.city);
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    }

    await board.deleteOne();
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
