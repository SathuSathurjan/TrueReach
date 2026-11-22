const User = require('../models/User');
const { isValidEmail, isValidPhone } = require('../utils/userValidation');

const serializeProfile = (user) => ({
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

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.email !== undefined && req.body.email !== user.email) {
      return res.status(400).json({ message: 'Account email cannot be changed' });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'A valid mobile number is required' });
    }

    user.name = name;
    user.phone = phone;

    if (user.role === 'advertiser') {
      const companyName = typeof req.body.companyName === 'string' ? req.body.companyName.trim() : '';
      const requestedCompanyEmail = typeof req.body.companyEmail === 'string'
        ? req.body.companyEmail.trim().toLowerCase()
        : user.companyEmail;
      const companyPhone = typeof req.body.companyPhone === 'string' ? req.body.companyPhone.trim() : '';

      if (!companyName) return res.status(400).json({ message: 'Company name is required' });
      if (!isValidEmail(requestedCompanyEmail)) {
        return res.status(400).json({ message: 'A valid company email is required' });
      }
      if (!isValidPhone(companyPhone)) {
        return res.status(400).json({ message: 'A valid company phone number is required' });
      }
      if (user.companyEmail && requestedCompanyEmail !== user.companyEmail) {
        return res.status(400).json({ message: 'Company email cannot be changed' });
      }

      user.companyName = companyName;
      user.companyEmail = requestedCompanyEmail;
      user.companyPhone = companyPhone;
    }

    await user.save();
    res.json(serializeProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
