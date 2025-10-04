-- Fix messages table to use timestamp column name
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Copy data from created_at to timestamp if created_at exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'created_at') THEN
        UPDATE messages SET timestamp = created_at WHERE timestamp IS NULL;
        ALTER TABLE messages DROP COLUMN created_at;
    END IF;
END $$;

-- Add reply_to_id column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;

-- Recreate index with correct column name
DROP INDEX IF EXISTS idx_messages_user_session;
CREATE INDEX IF NOT EXISTS idx_messages_user_session ON messages(user_id, session_id, timestamp DESC);
