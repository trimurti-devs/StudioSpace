import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Input validation
const validateBoard = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('backgroundColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid background color format'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
];

// @route   GET /api/boards
// @desc    Get user's boards
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, COUNT(i.id) as image_count,
             CASE WHEN lb.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM boards b
      LEFT JOIN images i ON b.id = i.board_id
      LEFT JOIN liked_boards lb ON b.id = lb.board_id AND lb.user_id = $1
      WHERE b.user_id = $1
    `;

    const params = [req.user.id];
    let paramCount = 2;

    if (search) {
      query += ` AND (b.title ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY b.id, lb.user_id ORDER BY b.updated_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM boards WHERE user_id = $1';
    const countParams = [req.user.id];

    if (search) {
      countQuery += ' AND (title ILIKE $2 OR description ILIKE $2)';
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      boards: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/boards/explore
// @desc    Get public boards for exploration
// @access  Public (optional auth)
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, search, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'b.created_at DESC';
    if (sort === 'popular') {
      orderBy = 'image_count DESC, b.created_at DESC';
    }

    let query = `
      SELECT b.id, b.title, b.description, b.background_color, b.created_at,
             u.name as author_name, u.avatar_url as author_avatar,
             COUNT(i.id) as image_count,
             CASE WHEN lb.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM boards b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN images i ON b.id = i.board_id
      LEFT JOIN liked_boards lb ON b.id = lb.board_id AND lb.user_id = $1
      WHERE b.is_public = true
    `;

    const params = [req.user?.id || null];
    let paramCount = 2;

    if (search) {
      query += ` AND (b.title ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY b.id, u.name, u.avatar_url ORDER BY ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM boards WHERE is_public = true';
    const countParams = [];

    if (search) {
      countQuery += ' AND (title ILIKE $1 OR description ILIKE $1)';
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      boards: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Explore boards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/boards/:id
// @desc    Get single board
// @access  Private or Public (if shared)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*, u.name as author_name, u.avatar_url as author_avatar,
              CASE WHEN lb.user_id IS NOT NULL THEN true ELSE false END as is_liked,
              CASE WHEN b.user_id = $2 THEN true ELSE false END as is_owner
       FROM boards b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN liked_boards lb ON b.id = lb.board_id AND lb.user_id = $2
       WHERE b.id = $1`,
      [id, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = result.rows[0];

    // Check permissions
    if (!board.is_public && (!req.user || board.user_id !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get images
    const imagesResult = await pool.query(
      'SELECT * FROM images WHERE board_id = $1 ORDER BY z_index ASC, created_at ASC',
      [id]
    );

    // Get tags
    const tagsResult = await pool.query(
      'SELECT name FROM tags WHERE board_id = $1 ORDER BY name ASC',
      [id]
    );

    board.images = imagesResult.rows;
    board.tags = tagsResult.rows.map(tag => tag.name);

    res.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/boards
// @desc    Create new board
// @access  Private
router.post('/', authenticateToken, validateBoard, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, backgroundColor = '#ffffff', isPublic = false } = req.body;

    // Generate share token for public boards
    const shareToken = isPublic ? uuidv4() : null;

    const result = await pool.query(
      `INSERT INTO boards (title, description, background_color, is_public, share_token, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, backgroundColor, isPublic, shareToken, req.user.id]
    );

    res.status(201).json({
      message: 'Board created successfully',
      board: result.rows[0]
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/boards/:id
// @desc    Update board
// @access  Private (owner only)
router.put('/:id', authenticateToken, validateBoard, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, backgroundColor, isPublic } = req.body;

    // Check ownership
    const boardCheck = await pool.query(
      'SELECT user_id, is_public FROM boards WHERE id = $1',
      [id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (boardCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate share token if making public and doesn't have one
    let shareToken = null;
    if (isPublic && !boardCheck.rows[0].is_public) {
      shareToken = uuidv4();
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (backgroundColor !== undefined) {
      updates.push(`background_color = $${paramCount++}`);
      values.push(backgroundColor);
    }

    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
      if (shareToken) {
        updates.push(`share_token = $${paramCount++}`);
        values.push(shareToken);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE boards SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Board updated successfully',
      board: result.rows[0]
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/boards/:id
// @desc    Delete board
// @access  Private (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const boardCheck = await pool.query(
      'SELECT user_id FROM boards WHERE id = $1',
      [id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (boardCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete board (images and tags will be deleted via CASCADE)
    await pool.query('DELETE FROM boards WHERE id = $1', [id]);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/boards/:id/like
// @desc    Like/unlike board
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if board exists and is public
    const boardCheck = await pool.query(
      'SELECT id, is_public, user_id FROM boards WHERE id = $1',
      [id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!boardCheck.rows[0].is_public && boardCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already liked
    const likeCheck = await pool.query(
      'SELECT id FROM liked_boards WHERE user_id = $1 AND board_id = $2',
      [req.user.id, id]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM liked_boards WHERE user_id = $1 AND board_id = $2',
        [req.user.id, id]
      );
      res.json({ message: 'Board unliked', liked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO liked_boards (user_id, board_id) VALUES ($1, $2)',
        [req.user.id, id]
      );
      res.json({ message: 'Board liked', liked: true });
    }
  } catch (error) {
    console.error('Like board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/boards/:id/share
// @desc    Get shareable board data
// @access  Public
router.get('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.id, b.title, b.description, b.background_color, b.created_at,
              u.name as author_name
       FROM boards b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.is_public = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found or not public' });
    }

    const board = result.rows[0];

    // Get images
    const imagesResult = await pool.query(
      'SELECT url, position_x, position_y, width, height, rotation FROM images WHERE board_id = $1 ORDER BY z_index ASC',
      [id]
    );

    board.images = imagesResult.rows;

    res.json({ board });
  } catch (error) {
    console.error('Share board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
