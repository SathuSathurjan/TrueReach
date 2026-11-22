const User = require('../models/User');
const City = require('../models/City');
const Board = require('../models/Board');
const { isValidEmail, isValidPhone } = require('../utils/userValidation');

// @route  POST /api/users   (superadmin only — creates a user of any role)
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role, city, phone,
      companyName, companyEmail, companyPhone,
    } = req.body;

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password ||
      typeof role !== 'string'
    ) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'A valid mobile number is required' });
    }

    let advertiserDetails = {};
    if (role === 'advertiser') {
      const normalizedCompanyName = typeof companyName === 'string' ? companyName.trim() : '';
      const normalizedCompanyEmail = typeof companyEmail === 'string' ? companyEmail.trim().toLowerCase() : '';
      const normalizedCompanyPhone = typeof companyPhone === 'string' ? companyPhone.trim() : '';
      if (!normalizedCompanyName) {
        return res.status(400).json({ message: 'Company name is required' });
      }
      if (!isValidEmail(normalizedCompanyEmail)) {
        return res.status(400).json({ message: 'A valid company email is required' });
      }
      if (!isValidPhone(normalizedCompanyPhone)) {
        return res.status(400).json({ message: 'A valid company phone number is required' });
      }
      advertiserDetails = {
        companyName: normalizedCompanyName,
        companyEmail: normalizedCompanyEmail,
        companyPhone: normalizedCompanyPhone,
      };
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
      city: city || null,
      phone: normalizedPhone,
      ...advertiserDetails,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      phone: user.phone,
      companyName: user.companyName,
      companyEmail: user.companyEmail,
      companyPhone: user.companyPhone,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/users?role=citymanager   (superadmin only)
exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).select('-password');
    const managerIds = users
      .filter((user) => user.role === 'citymanager')
      .map((user) => user._id);
    const assignedCities = managerIds.length
      ? await City.find({ cityManager: { $in: managerIds } }).select('name cityManager')
      : [];
    const cityByManagerId = new Map(
      assignedCities.map((city) => [
        city.cityManager.toString(),
        { _id: city._id, name: city.name },
      ])
    );

    res.json(users.map((user) => {
      const result = user.toObject();
      if (user.role === 'citymanager') {
        result.city = cityByManagerId.get(user._id.toString()) || null;
      }
      return result;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/users/:id   (superadmin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('city', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/users/:id/approve   (superadmin only)
exports.approveCityManager = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'citymanager') {
      return res.status(400).json({ message: 'Only city manager accounts can be approved' });
    }

    user.isApproved = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      city: user.city,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/users/:id/status   (superadmin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!['citymanager', 'advertiser'].includes(user.role)) {
      return res.status(400).json({ message: 'Only city manager or advertiser accounts can be deactivated' });
    }

    if (!isActive && user.role === 'citymanager') {
      const cities = await City.find({ cityManager: user._id }).select('_id');
      await City.updateMany({ cityManager: user._id }, { cityManager: null });
      await Board.updateMany(
        { city: { $in: cities.map((city) => city._id) } },
        { status: 'inactive' }
      );
      user.city = null;
    }
    user.isActive = isActive;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
      city: user.city,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/users/:id   (superadmin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, city } = req.body;
    // Note: email, password and role are intentionally not editable here to keep this simple.
    // Role changes or password resets should go through dedicated, more carefully guarded flows.

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (city !== undefined) user.city = city;

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, city: user.city });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/users/:id   (superadmin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If this user was assigned as a city manager, unassign them and deactivate their boards.
    const cities = await City.find({ cityManager: user._id }).select('_id');
    await City.updateMany({ cityManager: user._id }, { cityManager: null });
    await Board.updateMany(
      { city: { $in: cities.map((city) => city._id) } },
      { status: 'inactive' }
    );

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
