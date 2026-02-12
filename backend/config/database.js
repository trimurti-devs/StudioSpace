import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        avatar_url TEXT,
        birth_date DATE,
        provider VARCHAR(50) DEFAULT 'local',
        provider_id VARCHAR(255),
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create boards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        background_color VARCHAR(7) DEFAULT '#ffffff',
        is_public BOOLEAN DEFAULT false,
        share_token VARCHAR(255) UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        public_id VARCHAR(255),
        position_x INTEGER DEFAULT 0,
        position_y INTEGER DEFAULT 0,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        rotation INTEGER DEFAULT 0,
        z_index INTEGER DEFAULT 0,
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(board_id, name)
      );
    `);

    // Create liked_boards table for user likes
    await client.query(`
      CREATE TABLE IF NOT EXISTS liked_boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, board_id)
      );
    `);

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_boards_share_token ON boards(share_token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_images_board_id ON images(board_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tags_board_id ON tags(board_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_liked_boards_user_id ON liked_boards(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_liked_boards_board_id ON liked_boards(board_id);`);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
