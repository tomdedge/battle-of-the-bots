# AuraFlow - Detailed Development Plan

## Project Overview
A Mindful Flow Assistant that helps users maintain focus and build positive digital habits through AI-powered calendar management and mindfulness tools, without the guilt typical of productivity apps.

## Architecture Overview

### Backend (Express + Socket.io)
```
/backend
├── server.js              # Main server entry point
├── routes/
│   ├── auth.js           # Google OAuth routes
│   ├── calendar.js       # Google Calendar API proxy
│   └── tasks.js          # Google Tasks API proxy
├── services/
│   ├── aiService.js      # LiteLLM integration
│   ├── googleAuth.js     # Google API authentication
│   └── calendarService.js # Calendar analysis logic
├── middleware/
│   ├── auth.js           # JWT/session middleware
│   └── logging.js        # Request/response logging
├── utils/
│   └── logger.js         # Winston logger setup
└── .env                  # Environment variables
```

### Frontend (React + Mantine UI)
```
/frontend
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── ChatInput.jsx
│   │   ├── Calendar/
│   │   │   ├── CalendarView.jsx      # react-big-calendar + Mantine styling
│   │   │   ├── EventCard.jsx         # Mantine Card component
│   │   │   └── FocusBlockSuggestion.jsx # Mantine overlay components
│   │   ├── Tasks/
│   │   │   ├── TaskList.jsx          # Mantine List component
│   │   │   └── TaskItem.jsx
│   │   ├── Meditation/
│   │   │   └── BoxBreathing.jsx      # Canvas + Mantine controls
│   │   ├── Navigation/
│   │   │   ├── BottomTabs.jsx        # Mantine Tabs
│   │   │   ├── DrawerMenu.jsx        # Mantine Drawer
│   │   │   └── Header.jsx            # Theme toggle + hamburger
│   │   ├── Settings/
│   │   │   └── PreferencesPage.jsx   # Theme settings + future prefs
│   │   └── Auth/
│   │       └── GoogleSignIn.jsx      # Mantine Button
│   ├── hooks/
│   │   ├── useSocket.js
│   │   ├── useAuth.js
│   │   └── useCalendar.js
│   ├── services/
│   │   ├── api.js         # API client
│   │   └── socket.js      # Socket.io client
│   ├── utils/
│   │   └── logger.js      # Frontend logging
│   └── App.jsx
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- **Purpose**: Test individual components in isolation
- **Location**: `frontend/src/__tests__/`
- **Coverage**: Component rendering, props, user interactions
- **Approach**: Mock Mantine components to avoid browser API dependencies

```bash
# Run unit tests
cd frontend && npm test

# Run with coverage
cd frontend && npm test -- --coverage --watchAll=false
```

**Test Structure:**
```
/frontend/src/__tests__/
├── components/
│   ├── Chat/
│   │   ├── ChatInterface.test.jsx
│   │   └── MessageBubble.test.jsx
│   ├── Calendar/
│   │   ├── CalendarView.test.jsx
│   │   └── FocusBlockSuggestion.test.jsx
│   ├── Navigation/
│   │   ├── Header.test.jsx          # ✅ Implemented
│   │   └── BottomTabs.test.jsx      # ✅ Implemented
│   └── Meditation/
│       └── BoxBreathing.test.jsx
├── hooks/
│   ├── useSocket.test.js
│   └── useCalendar.test.js
└── services/
    └── api.test.js
```

### E2E Tests (Playwright)
- **Purpose**: Test complete user workflows in real browsers
- **Location**: `frontend/e2e/`
- **Coverage**: Tab navigation, theme toggling, app loading, user journeys
- **Benefits**: No mocking needed, tests actual user experience

```bash
# Run E2E tests
cd frontend && npm run test:e2e

# Run with UI mode
cd frontend && npm run test:e2e:ui

# View test report
cd frontend && npx playwright show-report
```

**Test Structure:**
```
/frontend/e2e/
├── app.spec.js              # ✅ Implemented (basic flows)
├── auth.spec.js             # TODO: Google sign-in flow
├── calendar.spec.js         # TODO: Calendar view and suggestions
├── chat.spec.js             # TODO: AI chat interactions
├── meditation.spec.js       # TODO: Box breathing interface
└── mocks/
    ├── googleCalendar.js    # TODO: Mock Google Calendar API responses
    └── testFixtures.js      # TODO: Consistent test calendar data
```

**Backend Unit Tests (Future)**
```
/backend/__tests__/
├── services/
│   ├── aiService.test.js
│   ├── calendarService.test.js
│   └── googleAuth.test.js
├── routes/
│   ├── calendar.test.js
│   └── tasks.test.js
├── utils/
│   └── logger.test.js
└── mocks/
    └── googleApis.js        # Mock Google Calendar/Tasks APIs
```

**Test Scenarios**
- [x] App loading and basic navigation
- [x] Tab switching functionality  
- [x] Theme toggle functionality
- [ ] User authentication flow
- [ ] Calendar data loading and display
- [ ] AI suggestion generation and approval across all views
- [ ] Chat message sending and AI responses
- [ ] Calendar view switching (month/week/day)
- [ ] Focus block suggestion acceptance/dismissal
- [ ] Mock Google Calendar API to avoid rate limits and ensure consistent test data

### Why This Two-Tier Approach?

**Unit Tests (Jest + RTL):**
- Fast feedback during development
- Good for component logic and props testing
- Mantine components mocked to avoid browser API issues

**E2E Tests (Playwright):**
- Reliable integration testing without Mantine v7+ mocking complexity
- Tests actual user experience in real browsers
- Catches integration bugs that unit tests miss

## Development Phases

### Phase 1: Foundation (Week 1-2)
**Backend Setup**
- [ ] Express server with Socket.io
- [ ] Environment configuration (.env setup)
- [ ] Winston logging implementation
- [ ] Google OAuth 2.0 integration
- [ ] Basic LiteLLM connection test

**Frontend Setup**
- [ ] React app with Mantine UI library
- [ ] Custom color palette with dark mode support:
  
  **Light Mode:**
  - Background: `#EFE2D3` (warm beige)
  - Primary: `#14BADB` (bright teal)
  - Secondary: `#1D9BBB` (deeper teal)
  - Accent: `#DA7576` (muted rose)
  - Text: `#854B58` (deep rose-brown)
  
  **Dark Mode:**
  - Background: `#854B58` (deep rose-brown)
  - Primary: `#14BADB` (bright teal - maintains brand)
  - Secondary: `#1D9BBB` (deeper teal)
  - Accent: `#DA7576` (muted rose)
  - Text: `#EFE2D3` (warm beige)

- [ ] Theme system: Default to system preference, manual override via header toggle + preferences page

- [ ] react-big-calendar for event display
- [ ] Mobile-first responsive design with Mantine components
- [ ] Bottom tab navigation (Mantine Tabs)
- [ ] Drawer navigation with hamburger menu (Mantine Drawer)
- [ ] Google Sign-In component (Mantine Button)
- [ ] Socket.io client connection

### Phase 2: Core AI Chat (Week 2-3)
**AI Service Integration**
- [ ] LiteLLM service wrapper
- [ ] Tool definitions for calendar/tasks operations
- [ ] Message processing pipeline
- [ ] Error handling and fallbacks

**Chat Interface**
- [ ] Real-time messaging via Socket.io
- [ ] Message history persistence
- [ ] Typing indicators
- [ ] AI response streaming

### Phase 3: Calendar Integration (Week 3-4)
**Google Calendar API**
- [ ] Calendar read/write permissions
- [ ] Event CRUD operations
- [ ] Calendar analysis service (gap detection, pattern recognition)
- [ ] Focus block suggestion algorithm

**Calendar UI**
- [ ] Calendar display using react-big-calendar with Mantine theming
- [ ] Build in complexity order: Day → Week → Month views
- [ ] Event visualization with Mantine Card components
- [ ] Inline focus block suggestions with view-specific UX:
  - **Day view**: Full Mantine Card suggestion overlays (build first)
  - **Week view**: Compact suggestion blocks in timeline gaps
  - **Month view**: Small badge indicators on empty time slots
- [ ] View switching controls (Mantine SegmentedControl)
- [ ] Approve/dismiss actions (Mantine Button components)

### Phase 4: Tasks & Meditation (Week 4-5)
**Google Tasks Integration**
- [ ] Tasks API integration
- [ ] Task CRUD operations via AI chat
- [ ] Task list synchronization

**Box Breathing Interface**
- [ ] HTML5 Canvas setup with CreateJS CDN (`https://code.createjs.com/1.0.0/createjs.min.js`)
- [ ] Breathing animation (4-4-4-4 pattern)
- [ ] Simple session timer
- [ ] Minimal UI controls (start/stop)

### Phase 5: Testing & Polish (Week 5-6)
**Testing Implementation**
- [ ] Unit tests for all components and services
- [ ] Integration tests for critical user flows
- [ ] Cross-browser testing (mobile focus)
- [ ] Performance optimization

**Production Readiness**
- [ ] Error boundaries and fallback UI
- [ ] Loading states and skeleton screens
- [ ] Accessibility audit (WCAG compliance)
- [ ] Security review (API endpoints, auth)

### Phase 6: Deployment (Week 6)
**Heroku Deployment Setup**
- [ ] Create Heroku app and configure buildpacks
- [ ] Set up Heroku Config Vars for production environment
- [ ] Configure Google OAuth for production domain
- [ ] Set up Heroku Postgres (if needed for user sessions)
- [ ] Configure production logging and monitoring
- [ ] Set up CI/CD pipeline (GitHub Actions → Heroku)
- [ ] Domain configuration and SSL setup

## Technical Implementation Details
```javascript
const calendarTools = [
  {
    name: "analyze_calendar",
    description: "Analyze calendar gaps and suggest focus blocks",
    parameters: { date, minDuration }
  },
  {
    name: "suggest_focus_block", 
    description: "Suggest specific focus block for user approval",
    parameters: { title, start, end, description }
  },
  {
    name: "list_tasks",
    description: "Get user's task list for context",
    parameters: { completed, dueDate }
  }
];
```

### Socket.io Events
```javascript
// Client -> Server
'chat_message'     // User sends message to AI
'calendar_sync'    // Request calendar refresh
'breathing_start'  // Start breathing session

// Server -> Client
'ai_response'      // AI response to user
'calendar_updated' // Calendar data changed
'focus_suggestion' // AI suggests focus blocks
```

### Environment Variables
```bash
# Backend .env
LLM_BASE_URL=http://localhost:4000
LLM_API_KEY=your_litellm_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
JWT_SECRET=your_jwt_secret
PORT=8080
NODE_ENV=development

# Frontend .env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

# Heroku Production Config Vars
LLM_BASE_URL=https://your-litellm-endpoint.com
LLM_API_KEY=prod_litellm_key
GOOGLE_CLIENT_ID=prod_google_client_id
GOOGLE_CLIENT_SECRET=prod_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.herokuapp.com/auth/google/callback
JWT_SECRET=secure_production_jwt_secret
PORT=process.env.PORT
NODE_ENV=production
REACT_APP_API_URL=https://your-app.herokuapp.com
REACT_APP_GOOGLE_CLIENT_ID=prod_google_client_id
```

## Key Features Implementation

### 1. AI Calendar Analysis
- **Gap Detection**: AI scans existing calendar events, identifies 25+ minute gaps
- **Smart Suggestions**: Avoids back-to-back meetings, considers time of day
- **Inline Display**: Show suggested focus blocks directly on calendar view
- **User Approval Required**: All suggestions need explicit user confirmation before scheduling

### 2. Conversational Calendar Management
- **Natural Language**: "Find me 2 hours for project work tomorrow"
- **Suggestion Mode**: AI proposes changes, user approves via calendar UI
- **Context Awareness**: AI remembers conversation context within session

### 3. Box Breathing Interface
- **CreateJS Animation**: Simple expanding/contracting circle using CreateJS CDN
- **Fixed Pattern**: 4-4-4-4 breathing rhythm for MVP
- **Basic Controls**: Start/stop buttons only

## Logging Strategy

### Backend Logging
```javascript
// Request/Response logging
logger.info('Calendar API request', { userId, endpoint, timestamp });
logger.error('LiteLLM error', { error, context, userId });

// AI interaction logging
logger.info('AI tool execution', { tool, parameters, result, duration });
```

### Frontend Logging
```javascript
// User interaction logging
logger.info('User action', { action: 'focus_block_accepted', duration: '60min' });
logger.info('Navigation', { from: 'chat', to: 'calendar' });

// Performance logging
logger.info('Component render', { component: 'CalendarView', renderTime: '45ms' });
```

## Future Considerations

### Scalability Hooks
- Database abstraction layer for user preferences
- Microservice architecture preparation
- Caching strategy for calendar data

### Group Chat Preparation
- User management system
- Room-based Socket.io namespaces
- Message broadcasting architecture

### Flow State Detection
- Activity monitoring service architecture
- Privacy-first data collection
- Pattern recognition algorithms

## Success Metrics
- User engagement with AI suggestions (acceptance rate)
- Calendar optimization (reduced context switching)
- Breathing session completion rates
- User retention without guilt-inducing metrics

## Risk Mitigation
- **Google API Rate Limits**: Implement caching and batch operations
- **AI Response Quality**: Fallback responses and error handling
- **User Privacy**: Minimal data collection, transparent permissions
- **Performance**: Lazy loading, optimistic UI updates

## Deployment Configuration

### Google OAuth Setup
**Development:**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:8080/auth/google/callback`

**Production:**
- Authorized JavaScript origins: `https://your-app.herokuapp.com`
- Authorized redirect URIs: `https://your-app.herokuapp.com/auth/google/callback`

### Heroku Deployment Checklist
- [ ] Create `Procfile`: `web: node backend/server.js`
- [ ] Configure buildpacks: `heroku/nodejs`
- [ ] Set all production config vars via Heroku CLI or dashboard
- [ ] Enable Heroku Postgres add-on (if using database)
- [ ] Configure Google Calendar/Tasks API scopes in Google Cloud Console
- [ ] Test OAuth flow in production environment
- [ ] Set up error monitoring (Sentry or similar)

## Development Timeline
- **Week 1-2**: Foundation and authentication
- **Week 3**: AI chat and basic calendar integration
- **Week 4**: Advanced calendar features and tasks
- **Week 5**: Meditation interface and polish
- **Week 6**: Testing, optimization, and deployment prep