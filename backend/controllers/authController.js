const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidEmail, isValidPhone } = require('../utils/userValidation');

const serializeUser = (user) => ({
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

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @route  POST /api/auth/register
exports.register = async (req, res) => {
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
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['advertiser', 'citymanager'].includes(role)) {
      return res.status(400).json({ message: 'Public registration is only available for advertisers and city managers' });
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

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
      phone: normalizedPhone,
      ...advertiserDetails,
      city: role === 'citymanager' ? null : city,
      isApproved: role === 'advertiser',
    });

    if (role === 'citymanager') {
      return res.status(201).json({
        message: 'Registration submitted. Your account will be available after admin approval.',
        status: 'pending',
      });
    }

    res.status(201).json({
      ...serializeUser(user),
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'citymanager' && user.isApproved === false) {
      return res.status(403).json({ message: 'Your city manager account is awaiting admin approval' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the super admin to reactivate it.' });
    }

    res.json({ ...serializeUser(user), token: generateToken(user._id, user.role) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
