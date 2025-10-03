# AuraFlow Migration Guide

## Upgrading from Old Chat Messages System

If you have an existing AuraFlow installation with the old `chat_messages` table, follow this guide to upgrade to the new flexible message system.

## What Changed

### Old System (chat_messages)
- Forced 1:1 pairing of user messages with AI responses
- Limited Aurora's ability to ask follow-up questions
- Text parsing for success detection (unreliable)

### New System (messages)
- Individual message storage for natural conversations
- Aurora can initiate conversations and ask clarifying questions
- Metadata-based tool execution tracking
- Support for future conversation threading

## Migration Steps

### 1. Backup Your Data
```bash
# Backup existing database
pg_dump $DATABASE_URL > auraflow_backup.sql
```

### 2. Run Migration
```bash
cd backend
npm run migrate
```

This creates the new `messages` table alongside your existing `chat_messages` table.

### 3. Verify Migration
```bash
npm run test-messages
```

Expected output:
```
🧪 Testing new message methods...
✅ User message saved: [id] [content]
✅ Aurora message saved: [id] [content]
✅ Messages retrieved: 2
✅ Converted to chat history: 1 entries
✅ Test cleanup completed
🎉 All tests passed!
```

### 4. Test Integration
```bash
node test_integration.js
```

### 5. Update Frontend
Restart your development server:
```bash
npm start
```

## What to Expect

### ✅ Immediate Benefits
- Aurora can now send follow-up messages after scheduling tasks
- More reliable task scheduling success detection
- Natural multi-turn conversations
- Better error handling and user feedback

### 🔄 Backward Compatibility
- Your old chat history remains accessible
- Old API endpoints still work
- Gradual transition to new system

### 🚀 Future Capabilities
- Conversation threading
- Proactive Aurora messages
- Rich message types
- Enhanced personalization

## Troubleshooting

### Migration Fails
```bash
# Check if messages table exists
psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages');"

# Manual migration if needed
psql $DATABASE_URL -f db/migrations/001_add_messages_table.sql
```

### Frontend Issues
```bash
# Clear browser cache
# Check browser console for errors
# Verify WebSocket connection in Network tab
```

### Database Permission Issues
```bash
# Ensure your database user has CREATE TABLE permissions
GRANT CREATE ON DATABASE auraflow TO your_username;
```

## Rollback (If Needed)

If you need to rollback:
```bash
# Drop new table (your old data is safe)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS messages;"

# Restart with old system
git checkout <previous-commit>
npm start
```

## Data Migration (Optional)

To convert your old chat history to the new format:
```bash
# This script converts chat_messages to individual messages
node scripts/convert_chat_history.js
```

**Note**: This is optional - both systems coexist safely.

## Getting Help

- Check console logs for specific error messages
- Verify database connectivity: `pg_isready`
- Ensure all environment variables are set
- Test with a fresh browser session (clear cache/cookies)

The migration is designed to be safe and reversible. Your existing data is preserved throughout the process.
