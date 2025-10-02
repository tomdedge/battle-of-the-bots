# Database Admin Setup

## Prerequisites
- Docker Desktop installed and running
- PostgreSQL database `auraflow` already created (run `./setup-db.sh` first)

## Quick Start

```bash
# Start database admin tools (with automatic checks)
npm run start:db-admin

# Stop database admin tools  
npm run stop:db-admin
```

The start script automatically checks:
- ✅ Docker is installed
- ✅ Docker daemon is running  
- ✅ PostgreSQL is running

## Access Points

### Adminer (Web Database Admin)
- **URL**: http://localhost:5051

**Login Details:**
- System: PostgreSQL
- Server: `host.docker.internal`
- Username: your system username (e.g., `jsirrine`)
- Password: (leave blank)
- Database: `auraflow`

### PostgREST (Auto-Generated API)
- **URL**: http://localhost:3001
- **OpenAPI Docs**: http://localhost:3001

**Available Endpoints:**
- `GET /users` - List users
- `GET /chat_messages` - List chat messages  
- `GET /user_preferences` - List user preferences
- `POST /users` - Create user
- `PATCH /users?id=eq.1` - Update user
- `DELETE /users?id=eq.1` - Delete user

## Troubleshooting

**Docker daemon not running:**
- Open Docker Desktop application
- Or run `colima start` (if using Colima)
- Or run `brew services start docker` (if using Homebrew)

**Can't connect to database in Adminer:**
- Try `localhost` instead of `host.docker.internal`
- Check PostgreSQL is running: `brew services list | grep postgresql`

**PostgREST not working:**
- Ensure PostgreSQL allows connections
- Check database exists: `psql -l | grep auraflow`