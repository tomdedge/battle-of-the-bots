# AuraFlow

A personal AI assistant with calendar integration, task management, and text-to-speech capabilities.

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (optional, for calendar sync)

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd auraflow
./setup.sh
```

2. **Configure environment:**
```bash
# Edit backend/.env with your credentials
nano backend/.env
```

3. **Start the application:**
```bash
npm start
```

The app will be available at http://localhost:3000

## Features

- **AI Chat Interface** - Powered by OpenAI GPT models
- **Text-to-Speech** - Browser-based with optional server enhancement on macOS
- **Calendar Integration** - Google Calendar sync and mindfulness suggestions  
- **Task Management** - Create and track tasks with AI assistance
- **PWA Support** - Install as a mobile/desktop app

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
DATABASE_URL=postgresql://username:password@localhost:5432/auraflow
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id (optional)
GOOGLE_CLIENT_SECRET=your_google_client_secret (optional)
JWT_SECRET=your_jwt_secret
```

## Text-to-Speech

- **Browser Mode**: Uses Web Speech API (works everywhere)
- **Server Mode**: Uses system TTS on macOS (`say` command) for enhanced quality
- **Automatic Fallback**: Falls back to browser mode if server TTS unavailable

## Deployment

The app is designed to work with minimal setup. Server TTS will automatically disable on platforms that don't support it, falling back to browser-based TTS.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm start`
5. Submit a pull request
