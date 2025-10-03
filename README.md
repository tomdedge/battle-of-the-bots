# AuraFlow

A personal AI assistant with calendar integration, task management, and text-to-speech capabilities.

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (optional, for calendar sync)

### Installation

#### Option 1: Docker (Recommended)
```bash
git clone <repository-url>
cd auraflow

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Build and run
docker-compose up --build
```
Access at `http://localhost:3001`

#### Option 2: Local Development
```bash
git clone <repository-url>
cd auraflow
./setup.sh
```

2. **Database Setup:**
```bash
# Create PostgreSQL database
createdb auraflow

# Run database migrations to create tables
cd backend
npm run migrate
```

3. **Configure environment:**
```bash
# Edit backend/.env with your credentials
nano backend/.env
```

4. **Start the application:**
```bash
npm start
```

The app will be available at http://localhost:3000

## Features

- **AI Chat Interface** - Powered by OpenAI GPT models with flexible message system
- **Text-to-Speech** - Browser-based with optional server enhancement on macOS
- **Calendar Integration** - Google Calendar sync and mindfulness suggestions  
- **Task Management** - Create and track tasks with AI assistance
- **Focus Sessions** - Timed focus blocks with session tracking
- **PWA Support** - Install as a mobile/desktop app

## Architecture

### Database Schema
AuraFlow uses PostgreSQL with the following key tables:
- **users** - User authentication and profile data
- **messages** - Individual chat messages (user and AI responses)
- **tasks** - Task management data
- **events** - Calendar events and focus sessions

The message system supports natural AI conversations, follow-up messages, and future conversation threading.

## Development

### Project Structure
```
auraflow/
├── frontend/          # React frontend
├── backend/           # Node.js/Express backend  
├── package.json       # Root package with scripts
└── README.md
```

### Available Scripts

- `npm start` - Start both frontend and backend
- `npm run dev` - Start in development mode with hot reload
- `npm run install-all` - Install all dependencies
- `npm run build` - Build for production

### Environment Variables

Create `backend/.env`:
```
# Database (required)
DATABASE_URL=postgresql://username:password@localhost:5432/auraflow

# AI Integration (required)
OPENAI_API_KEY=your_openai_key

# Google Calendar/Tasks (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Authentication (required)
JWT_SECRET=your_jwt_secret
```

### Database Migration

The setup script automatically runs migrations, but you can also run them manually:
```bash
cd backend
npm run migrate
```

To verify your database setup:
```bash
npm run test-messages
```

## Text-to-Speech

- **Browser Mode**: Uses Web Speech API (works everywhere)
- **Server Mode**: Uses system TTS on macOS (`say` command) for enhanced quality
- **Automatic Fallback**: Falls back to browser mode if server TTS unavailable

## Deployment

The app is designed to work with minimal setup. Server TTS will automatically disable on platforms that don't support it, falling back to browser-based TTS.

## Troubleshooting

### Database Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep auraflow

# Check if tables were created
psql $DATABASE_URL -c "\dt"
```

### Common Setup Issues
- **Port conflicts**: Frontend (3000) and backend (5000) must be available
- **Database permissions**: Ensure your PostgreSQL user can create tables
- **Environment variables**: Double-check DATABASE_URL format and credentials

### Getting Help
- Check the console for error messages
- Verify all dependencies installed with `npm run install-all`
- Ensure PostgreSQL service is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm start`
5. Submit a pull request
