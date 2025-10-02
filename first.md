# AuraFlow - First Commit MVP

## Goal
Get a basic React + Express app running with Mantine UI, basic routing, and placeholder components. No external APIs yet - just the foundation.

## First Commit Scope

### Backend (Minimal Express Server)
```
/backend
├── server.js              # Basic Express server with CORS
├── package.json           # Dependencies: express, cors, dotenv
└── .env.example           # Template for environment variables
```

**Features:**
- [ ] Express server on port 8080
- [ ] CORS enabled for localhost:3000
- [ ] Basic health check endpoint `/api/health`
- [ ] Environment variable setup (no secrets yet)

### Frontend (Basic React + Mantine)
```
/frontend
├── src/
│   ├── components/
│   │   ├── Navigation/
│   │   │   ├── BottomTabs.jsx     # Mantine Tabs with 4 placeholder tabs
│   │   │   └── Header.jsx         # Header with hamburger + theme toggle
│   │   ├── Chat/
│   │   │   └── ChatPlaceholder.jsx # "Chat coming soon" message
│   │   ├── Calendar/
│   │   │   └── CalendarPlaceholder.jsx # "Calendar coming soon" message
│   │   ├── Tasks/
│   │   │   └── TasksPlaceholder.jsx # "Tasks coming soon" message
│   │   └── Meditation/
│   │       └── MeditationPlaceholder.jsx # "Meditation coming soon" message
│   ├── App.jsx            # Main app with routing and theme provider
│   ├── theme.js           # Custom Mantine theme with AuraFlow colors
│   └── index.js           # React entry point
├── package.json           # Dependencies: react, @mantine/core, @mantine/hooks
└── .env.example           # Template for frontend env vars
```

**Features:**
- [ ] Mantine UI setup with custom AuraFlow theme
- [ ] Dark/light mode toggle in header
- [ ] Bottom tab navigation between 4 sections
- [ ] Responsive mobile-first layout
- [ ] Placeholder components for each section

## File Structure
```
auraflow/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation/
│   │   │   │   ├── BottomTabs.jsx
│   │   │   │   └── Header.jsx
│   │   │   ├── Chat/
│   │   │   │   └── ChatPlaceholder.jsx
│   │   │   ├── Calendar/
│   │   │   │   └── CalendarPlaceholder.jsx
│   │   │   ├── Tasks/
│   │   │   │   └── TasksPlaceholder.jsx
│   │   │   └── Meditation/
│   │   │       └── MeditationPlaceholder.jsx
│   │   ├── App.jsx
│   │   ├── theme.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── plan.md
├── first.md
└── README.md
```

## Dependencies

### Backend package.json
```json
{
  "name": "auraflow-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Frontend package.json
```json
{
  "name": "auraflow-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@mantine/core": "^7.0.0",
    "@mantine/hooks": "^7.0.0",
    "@tabler/icons-react": "^2.40.0"
  }
}
```

## Custom Theme (theme.js)
```javascript
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colors: {
    aura: [
      '#EFE2D3', // 0 - background light
      '#14BADB', // 1 - primary teal
      '#1D9BBB', // 2 - secondary teal
      '#DA7576', // 3 - accent rose
      '#854B58', // 4 - dark rose-brown
      '#14BADB', // 5
      '#1D9BBB', // 6
      '#DA7576', // 7
      '#854B58', // 8
      '#854B58'  // 9
    ]
  },
  primaryColor: 'aura',
  primaryShade: 1,
  other: {
    backgroundLight: '#EFE2D3',
    backgroundDark: '#854B58',
    textLight: '#854B58',
    textDark: '#EFE2D3'
  }
});
```

## Success Criteria for First Commit
- [ ] `npm run dev` starts backend on port 8080
- [ ] `npm start` starts frontend on port 3000
- [ ] App loads with AuraFlow colors and theme
- [ ] Bottom tabs switch between placeholder screens
- [ ] Theme toggle works (light/dark mode)
- [ ] Mobile responsive layout
- [ ] No console errors

## Next Steps After First Commit
1. Add Google OAuth authentication
2. Implement basic chat interface
3. Add Socket.io for real-time communication
4. Integrate LiteLLM endpoint
5. Build calendar components

## Commands to Run
```bash
# Setup
mkdir auraflow
cd auraflow
mkdir backend frontend

# Backend
cd backend
npm init -y
npm install express cors dotenv
npm install -D nodemon

# Frontend  
cd ../frontend
npx create-react-app . --template typescript
npm install @mantine/core @mantine/hooks @tabler/icons-react

# Start development
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm start
```

This first commit establishes the foundation without any complex integrations. Everything should work locally and provide a solid base for iterative development.