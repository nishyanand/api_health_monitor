const jwt  = require('jsonwebtoken');
const User = require('../models/user.model');

// ─────────────────────────────────────────────
// Helper: generate JWT token
// ─────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}


// ─────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // validate
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required',
      });
    }

    // check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // create user — password is hashed automatically
    // by the pre save hook in user.model.js
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id   : user._id,
        name : user.name,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
}


// ─────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // compare password using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id   : user._id,
        name : user.name,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
}


// ─────────────────────────────────────────────
// GET PROFILE
// GET /api/auth/me
// ─────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    // find by id but exclude password from result
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };