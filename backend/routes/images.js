import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Input validation
const validateImageUpdate = [
  body('positionX').optional().isInt({ min: 0 }).withMessage('Position X must be a non-negative integer'),
  body('positionY').optional().isInt({ min: 0 }).withMessage('Position Y must be a non-negative integer'),
  body('width').optional().isInt({ min: 1 }).withMessage('Width must be a positive integer'),
  body('height').optional().isInt({ min: 1 }).withMessage('Height must be a positive integer'),
  body('rotation').optional().isInt({ min: -360, max: 360 }).withMessage('Rotation must be between -360 and 360 degrees'),
  body('zIndex').optional().isInt().withMessage('Z-index must be an integer')
];

// @route   POST /api/images/upload
// @desc    Upload image to board
// @access  Private
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { boardId, positionX = 0, positionY = 0, width, height, rotation = 0, zIndex = 0 } = req.body;

    if (!boardId) {
      return res.status(400).json({ message: 'Board ID is required' });
    }

    // Check if board exists and user owns it
    const boardCheck = await pool.query(
      'SELECT id FROM boards WHERE id = $1 AND user_id = $2',
      [boardId, req.user.id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found or access denied' });
    }

    // Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'moodboard-images',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
        { quality: 'auto' }
      ]
    });

    // Save to database
    const result = await pool.query(
      `INSERT INTO images (url, public_id, position_x, position_y, width, height, rotation, z_index, board_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        uploadResult.secure_url,
        uploadResult.public_id,
        positionX,
        positionY,
        width || uploadResult.width,
        height || uploadResult.height,
        rotation,
        zIndex,
        boardId
      ]
    );

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/images/:id
// @desc    Update image properties
// @access  Private
router.put('/:id', authenticateToken, validateImageUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { positionX, positionY, width, height, rotation, zIndex } = req.body;

    // Check if image exists and user owns the board
    const imageCheck = await pool.query(
      `SELECT i.id FROM images i
       JOIN boards b ON i.board_id = b.id
       WHERE i.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found or access denied' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (positionX !== undefined) {
      updates.push(`position_x = $${paramCount++}`);
      values.push(positionX);
    }

    if (positionY !== undefined) {
      updates.push(`position_y = $${paramCount++}`);
      values.push(positionY);
    }

    if (width !== undefined) {
      updates.push(`width = $${paramCount++}`);
      values.push(width);
    }

    if (height !== undefined) {
      updates.push(`height = $${paramCount++}`);
      values.push(height);
    }

    if (rotation !== undefined) {
      updates.push(`rotation = $${paramCount++}`);
      values.push(rotation);
    }

    if (zIndex !== undefined) {
      updates.push(`z_index = $${paramCount++}`);
      values.push(zIndex);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE images SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Image updated successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/images/:id
// @desc    Delete image
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get image data and check ownership
    const imageResult = await pool.query(
      `SELECT i.public_id FROM images i
       JOIN boards b ON i.board_id = b.id
       WHERE i.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found or access denied' });
    }

    // Delete from Cloudinary
    if (imageResult.rows[0].public_id) {
      try {
        await cloudinary.uploader.destroy(imageResult.rows[0].public_id);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await pool.query('DELETE FROM images WHERE id = $1', [id]);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/images/:id/duplicate
// @desc    Duplicate image
// @access  Private
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { offsetX = 20, offsetY = 20 } = req.body;

    // Get original image and check ownership
    const imageResult = await pool.query(
      `SELECT * FROM images i
       JOIN boards b ON i.board_id = b.id
       WHERE i.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found or access denied' });
    }

    const originalImage = imageResult.rows[0];

    // Create duplicate
    const result = await pool.query(
      `INSERT INTO images (url, public_id, position_x, position_y, width, height, rotation, z_index, board_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        originalImage.url,
        originalImage.public_id,
        originalImage.position_x + offsetX,
        originalImage.position_y + offsetY,
        originalImage.width,
        originalImage.height,
        originalImage.rotation,
        originalImage.z_index + 1,
        originalImage.board_id
      ]
    );

    res.status(201).json({
      message: 'Image duplicated successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Duplicate image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/images/reorder
// @desc    Reorder images (update z-index)
// @access  Private
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ message: 'imageIds must be an array' });
    }

    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update z-index for each image
      for (let i = 0; i < imageIds.length; i++) {
        // Check ownership
        const ownershipCheck = await client.query(
          `SELECT i.id FROM images i
           JOIN boards b ON i.board_id = b.id
           WHERE i.id = $1 AND b.user_id = $2`,
          [imageIds[i], req.user.id]
        );

        if (ownershipCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: `Image ${imageIds[i]} not found or access denied` });
        }

        await client.query(
          'UPDATE images SET z_index = $1 WHERE id = $2',
          [i, imageIds[i]]
        );
      }

      await client.query('COMMIT');

      res.json({ message: 'Images reordered successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
