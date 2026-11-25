const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'webdev3_jwt_secret_key_2026_super_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    const userId = newUser._id ? newUser._id.toString() : newUser.id;

    // Emit event for event-driven logging / auditing
    appEvents.emit('user:registered', {
      id: userId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    // Exactly matches Assignment Fig 1 output
    return res.status(201).json({
      message: 'User registered',
      id: userId,
      username: newUser.username,
      email: newUser.email
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    let isMatch = false;
    if (typeof user.matchPassword === 'function') {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = await User.comparePassword(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userId = user._id ? user._id.toString() : user.id;
    const token = generateToken(userId, user.role || 'user');

    // Emit event for user login
    appEvents.emit('user:login', {
      id: userId,
      username: user.username,
      email: user.email
    });

    // Exactly matches Assignment Fig 1 output
    return res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Protected route)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users (RBAC demonstration - Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  getAllUsers
};
