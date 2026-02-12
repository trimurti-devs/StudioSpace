import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Input validation middleware
const validateSignup = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('birthDate').isISO8601().withMessage('Valid birth date required')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
];

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, birthDate } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, birth_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, birth_date, avatar_url, created_at`,
      [name, email, passwordHash, birthDate]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/signup
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { name, email, avatar, providerId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      // Create new Google user
      const result = await pool.query(
        `INSERT INTO users (name, email, avatar_url, provider, provider_id, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, avatar_url, provider, email_verified, created_at`,
        [name, email, avatar, 'google', providerId, true]
      );
      user = result;
    } else {
      // Update existing user's Google info if not set
      if (!user.rows[0].provider_id && providerId) {
        await pool.query(
          'UPDATE users SET provider = $1, provider_id = $2, avatar_url = COALESCE($3, avatar_url) WHERE id = $4',
          ['google', providerId, avatar, user.rows[0].id]
        );
      }
    }

    const userData = user.rows[0];
    const token = generateToken(userData.id);

    // Return user without sensitive data
    const { password_hash, ...userWithoutPassword } = userData;

    res.json({
      message: 'Google authentication successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
