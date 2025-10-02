-- Add picture column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture TEXT;