import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Input validation
const validateUpdateProfile = [
  body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('birthDate').optional().isISO8601().withMessage('Valid birth date required')
];

const validateChangePassword = [
  body('currentPassword').exists().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, avatar_url, birth_date, provider, email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateUpdateProfile, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, birthDate } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Email already in use' });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (birthDate !== undefined) {
      updates.push(`birth_date = $${paramCount++}`);
      values.push(birthDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, avatar_url, birth_date, provider, email_verified, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validateChangePassword, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    // Delete user (boards and images will be deleted via CASCADE)
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get board count
    const boardsResult = await pool.query(
      'SELECT COUNT(*) as count FROM boards WHERE user_id = $1',
      [req.user.id]
    );

    // Get total images count
    const imagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM images i JOIN boards b ON i.board_id = b.id WHERE b.user_id = $1',
      [req.user.id]
    );

    // Get liked boards count
    const likesResult = await pool.query(
      'SELECT COUNT(*) as count FROM liked_boards WHERE user_id = $1',
      [req.user.id]
    );

    // Get public boards count
    const publicBoardsResult = await pool.query(
      'SELECT COUNT(*) as count FROM boards WHERE user_id = $1 AND is_public = true',
      [req.user.id]
    );

    res.json({
      stats: {
        totalBoards: parseInt(boardsResult.rows[0].count),
        totalImages: parseInt(imagesResult.rows[0].count),
        likedBoards: parseInt(likesResult.rows[0].count),
        publicBoards: parseInt(publicBoardsResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
