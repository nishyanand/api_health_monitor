const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
  findUserByEmail,
  findUserById,
  createUser
} = require('../models/user.model');

// ─────────────────────────────────────────────
// Helper: generate JWT token for a user
// ─────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { userId },                          // payload — what we store inside token
    process.env.JWT_SECRET,              // secret key to sign with
    { expiresIn: process.env.JWT_EXPIRES_IN } // token expiry
  );
}


// ─────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// Body: { name, email, password }
// ─────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // validate — all fields required
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required',
      });
    }

    // check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // hash the password — never store plain text
    // 10 = salt rounds (how strong the hash is)
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = createUser({
      id      : uuidv4(),   // unique id
      name,
      email,
      password: hashedPassword,
    });

    // generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id   : user.id,
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
// Body: { email, password }
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
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id   : user.id,
        name : user.name,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
}


// ─────────────────────────────────────────────
// GET PROFILE (protected route example)
// GET /api/auth/me
// ─────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    // req.userId is set by auth middleware
    const user = findUserById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id   : user.id,
        name : user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };