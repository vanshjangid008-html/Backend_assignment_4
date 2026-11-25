const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = null;

  // 1. Check Authorization header (Bearer <token> or direct token)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = authHeader;
    }
  }

  // 2. Check Cookie header (e.g., token=...)
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'token') {
        token = value;
        break;
      }
    }
  }

  // 3. Check custom header (x-access-token)
  if (!token && req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    // Exactly matches Assignment 4 screenshot: Status 403 Forbidden {"message": "No token provided"}
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'webdev3_jwt_secret_key_2026_super_secure';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = {
      id: user._id ? user._id.toString() : user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-Based Access Control (RBAC) middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: role '${req.user ? req.user.role : 'guest'}' does not have permission to access this resource`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
