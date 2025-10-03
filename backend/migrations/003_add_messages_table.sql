-- Messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  session_id VARCHAR(255),
  conversation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_session ON messages(user_id, session_id, created_at DESC);
