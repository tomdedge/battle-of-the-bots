-- New messages table for flexible messaging
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(10) CHECK (sender IN ('user', 'aurora')) NOT NULL,
  model VARCHAR(100),
  session_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Optional: For future conversation threading
  conversation_id UUID DEFAULT gen_random_uuid(),
  reply_to_id INTEGER REFERENCES messages(id)
);

-- Indexes for performance
CREATE INDEX idx_messages_user_timestamp ON messages(user_id, timestamp DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_session ON messages(session_id);
