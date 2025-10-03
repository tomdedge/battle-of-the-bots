# AuraFlow Setup Guide

## Database Migration (New Message System)

### Overview
AuraFlow has been upgraded to use a new flexible message system that supports:
- Individual message storage (no forced user/aurora pairing)
- Aurora-initiated conversations
- Multi-message sequences
- Future conversation threading

### Migration Steps

#### 1. Run Database Migration
```bash
cd backend
npm run migrate
```

This creates the new `messages` table alongside the existing `chat_messages` table.

#### 2. Verify Migration
```bash
npm run test-messages
```

Should output:
```
🧪 Testing new message methods...
✅ User message saved: [id] [content]
✅ Aurora message saved: [id] [content]
✅ Messages retrieved: 2
✅ Converted to chat history: 1 entries
✅ Test cleanup completed
🎉 All tests passed!
```

### What Changed

#### Database Schema
**New Table: `messages`**
```sql
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
```

**Old Table: `chat_messages` (still exists for compatibility)**
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,     -- User message (forced pairing)
  response TEXT NOT NULL,    -- Aurora response (forced pairing)
  model VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255)
);
```

#### Backend Changes
- **New Methods**: `saveMessage()`, `getMessages()`, `deleteMessage()`, `clearMessages()`
- **Socket Events**: `messages` (instead of `chat_history`), `messages_cleared`
- **API Endpoints**: `/auth/messages/:messageId` for deletion
- **inject_aurora_message**: Now uses new table for proper storage

#### Frontend Changes
- **useSocket**: Uses `messages` array instead of `chatHistory`
- **ChatInterface**: Direct message display (no conversion needed)
- **Message Format**: `{id, content, sender, timestamp, model}`

### Current System Status

#### ✅ Working Features
- Regular chat conversations
- Aurora injected messages (task scheduling follow-ups)
- Message deletion
- Task scheduling with proper success detection
- Multi-message conversations

#### 🔄 Backward Compatibility
- Old `chat_messages` table still exists
- Conversion helper available: `convertMessagesToChatHistory()`
- Old API endpoints still functional

### Development Commands

```bash
# Run migration
npm run migrate

# Test new message system
npm run test-messages

# Test integration
node test_integration.js

# Test task scheduling follow-up
node test_task_followup.js

# Start development server
npm run dev
```

### Troubleshooting

#### Migration Issues
```bash
# Check if messages table exists
psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages');"

# Manual migration (if needed)
psql $DATABASE_URL -f db/migrations/001_add_messages_table.sql
```

#### Frontend Issues
```bash
# Clear browser cache and restart
# Check console for errors
# Verify socket connection in Network tab
```

### Future Capabilities Enabled

With the new message system, Aurora can now:
- **Ask clarifying questions**: "What time would work best for this task?"
- **Send proactive messages**: "I noticed you have unscheduled tasks..."
- **Multi-turn conversations**: Natural back-and-forth about scheduling
- **Conversation threading**: Reply to specific messages (future feature)
- **Rich messaging**: Support for different message types (future feature)

### Migration Safety

#### Development Environment
- ✅ Safe to run migration (no data loss concerns)
- ✅ Both old and new systems coexist
- ✅ Easy rollback by dropping new table

#### Production Environment (Future)
- Backup database before migration
- Test migration on copy first
- Monitor performance after deployment
- Keep old table for rollback capability

### Next Steps

1. **Test the new system** with task scheduling
2. **Verify follow-up messages** appear in main chat
3. **Implement Phase 4** (cleanup and advanced features)
4. **Add conversation threading** (future enhancement)
5. **Add proactive Aurora features** (future enhancement)

The new message system provides a solid foundation for natural AI conversations and advanced features!
