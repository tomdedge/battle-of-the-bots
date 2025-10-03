# AuraFlow Setup Guide

## For New Developers

Follow the [README.md](README.md) for initial setup.

## For Existing Users

If you have an existing installation, see [MIGRATION.md](MIGRATION.md) for upgrade instructions.

## Development Setup

### Database Schema Overview
AuraFlow uses a flexible message system that supports:
- Individual message storage (no forced user/aurora pairing)
- Aurora-initiated conversations
- Multi-message sequences
- Future conversation threading

### Key Tables
```sql
-- New flexible message system
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(10) CHECK (sender IN ('user', 'aurora')) NOT NULL,
  model VARCHAR(100),
  session_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  conversation_id UUID DEFAULT gen_random_uuid(),
  reply_to_id INTEGER REFERENCES messages(id)
);

-- Legacy table (still supported)
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255)
);
```

### API Changes
- **New Methods**: `saveMessage()`, `getMessages()`, `deleteMessage()`, `clearMessages()`
- **Socket Events**: `messages` (instead of `chat_history`), `messages_cleared`
- **API Endpoints**: `/auth/messages/:messageId` for deletion
- **Message Format**: `{id, content, sender, timestamp, model}`

### Frontend Changes
- **useSocket**: Uses `messages` array instead of `chatHistory`
- **ChatInterface**: Direct message display (no conversion needed)
- **Aurora Follow-ups**: Properly stored and displayed in main chat

## Development Commands

```bash
# Install dependencies
npm run install-all

# Start development server
npm run dev

# Run database migration
cd backend && npm run migrate

# Test message system
npm run test-messages

# Test integration
node test_integration.js

# Build for production
npm run build
```

## Testing

### Message System Tests
```bash
# Test new message methods
npm run test-messages

# Test task scheduling follow-up
node test_task_followup.js

# Integration test
node test_integration.js
```

### Manual Testing
1. Start the app: `npm start`
2. Create a task and ask Aurora to schedule it
3. Verify follow-up message appears in main chat
4. Test message deletion functionality
5. Test chat history persistence

## Troubleshooting

### Database Issues
```bash
# Check if messages table exists
psql $DATABASE_URL -c "\dt messages"

# Verify migration ran successfully
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'messages';"
```

### Frontend Issues
- Clear browser cache and restart
- Check console for WebSocket connection errors
- Verify API endpoints are responding

### Performance
- Message queries are optimized with indexes
- Old chat_messages table can be dropped after migration verification
- Consider pagination for large message histories

## Future Enhancements

The new message system enables:
- **Conversation threading**: Reply to specific messages
- **Proactive Aurora**: Morning briefings, reminders
- **Rich messages**: Different message types and attachments
- **Multi-turn scheduling**: Natural back-and-forth conversations
- **Context awareness**: Aurora remembers conversation context
