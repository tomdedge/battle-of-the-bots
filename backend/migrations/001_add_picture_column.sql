-- Migration: Add picture column to users table
-- Run with: npm run migrate

ALTER TABLE users ADD COLUMN IF NOT EXISTS picture TEXT;