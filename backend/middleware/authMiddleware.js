const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT token and attaches user info to req.user
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }

  if (['citymanager', 'advertiser'].includes(decoded.role)) {
    try {
      const user = await User.findById(decoded.id).select('isActive');
      if (!user || user.isActive === false) {
        return res.status(403).json({ message: 'Account is inactive or unavailable' });
      }
    } catch (err) {
      console.error('Failed to verify account status:', err.message);
      return res.status(500).json({ message: 'Unable to verify account status' });
    }
  }

  req.user = decoded; // { id, role }
  return next();
};

// Restricts access to specific roles
// Usage: router.get('/', protect, authorize('superadmin'), handler)
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied for your role' });
    }
    next();
  };
};
