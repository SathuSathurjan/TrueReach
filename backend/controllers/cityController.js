const City = require('../models/City');
const User = require('../models/User');

// @route  POST /api/cities   (superadmin only)
exports.createCity = async (req, res) => {
  try {
    const { name, cityManager, status } = req.body;
    const cityName = typeof name === 'string' ? name.trim() : '';

    if (!cityName) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const exists = await City.findOne({ name: cityName }).collation({ locale: 'en', strength: 2 });
    if (exists) {
      return res.status(400).json({ message: 'City already exists' });
    }

    // If a city manager is assigned, verify that user exists and has the right role
    if (cityManager) {
      const manager = await User.findById(cityManager);
      if (!manager || manager.role !== 'citymanager' || manager.isApproved === false || manager.isActive === false) {
        return res.status(400).json({ message: 'Invalid city manager' });
      }
    }

    const city = await City.create({ name: cityName, cityManager, status });
    res.status(201).json(city);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'City already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/cities   (superadmin only — list all)
exports.getCities = async (req, res) => {
  try {
    const cities = await City.find().populate('cityManager', 'name email');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/cities/:id   (superadmin, or the assigned city manager)
exports.getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id).populate('cityManager', 'name email');
    if (!city) return res.status(404).json({ message: 'City not found' });

    // City managers can only view their own assigned city
    if (
      req.user.role === 'citymanager' &&
      (!city.cityManager || city.cityManager._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(city);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/cities/:id   (superadmin only)
exports.updateCity = async (req, res) => {
  try {
    const { name, cityManager, status } = req.body;
    const cityName = typeof name === 'string' ? name.trim() : name;

    if (name !== undefined && (typeof name !== 'string' || !cityName)) {
      return res.status(400).json({ message: 'City name is required' });
    }

    if (cityManager) {
      const manager = await User.findById(cityManager);
      if (!manager || manager.role !== 'citymanager' || manager.isApproved === false || manager.isActive === false) {
        return res.status(400).json({ message: 'Invalid city manager' });
      }
    }

    const existingCity = await City.findById(req.params.id);
    if (!existingCity) return res.status(404).json({ message: 'City not found' });

    const previousManagerId = existingCity.cityManager ? existingCity.cityManager.toString() : null;

    if (cityName !== undefined) {
      const duplicate = await City.findOne({
        name: cityName,
        _id: { $ne: existingCity._id },
      }).collation({ locale: 'en', strength: 2 });
      if (duplicate) {
        return res.status(400).json({ message: 'City already exists' });
      }
    }

    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name: cityName, cityManager, status },
      { new: true, runValidators: true }
    );

    // Keep User.city in sync with City.cityManager on both sides of the change
    if (cityManager !== undefined) {
      // Unassign the previous manager's city, if it changed
      if (previousManagerId && previousManagerId !== cityManager) {
        await User.findByIdAndUpdate(previousManagerId, { city: null });
      }
      // Assign the new manager's city (cityManager may be null/empty to unassign)
      if (cityManager) {
        await User.findByIdAndUpdate(cityManager, { city: city._id });
      }
    }

    res.json(city);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'City already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/cities/:id   (superadmin only)
exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json({ message: 'City deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
