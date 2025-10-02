# AuraFlow Setup Guide

## For New Developers

After pulling this branch, run:

```bash
# Install dependencies
npm run install:all

# Run database migrations
cd backend && npm run migrate

# Start the application
npm start
```

## Database Migrations

When schema changes are made, they're stored in `backend/migrations/`. 

To apply all migrations:
```bash
cd backend && npm run migrate
```

## Current Migrations

- `001_add_picture_column.sql` - Adds Google profile picture support