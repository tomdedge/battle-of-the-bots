# AuraFlow Authentication Implementation Plan

## Overview
Implement Google OAuth 2.0 authentication system that integrates with the **existing** Express + Socket.io + AI chat system, providing access to Google Calendar and Google Tasks APIs for the AuraFlow mindful productivity application.

## Current State Analysis
**✅ Already Implemented:**
- Socket.io server and client integration
- AI Service with LiteLLM integration  
- Complete chat interface with real-time messaging
- Playwright E2E testing framework
- Working chat with model selection

**🔄 Requires Auth Integration:**
- Socket.io connections are currently unauthenticated
- AI service uses anonymous user context
- No user-specific data persistence
- Chat history not tied to users

## Updated Architecture Requirements

### Core Components
1. **Backend Authentication Service** - Handle OAuth flow and token management
2. **Frontend Auth Components** - Sign-in UI and auth state management  
3. **Socket.io Authentication Middleware** - Secure existing WebSocket connections
4. **API Middleware** - Protect routes and validate tokens
5. **Google API Integration** - Calendar and Tasks API access
6. **User Context in AI Service** - Personalized AI responses

### Security Considerations
- JWT tokens for session management
- Secure token storage and refresh
- Socket.io authentication middleware
- CORS configuration for frontend/backend communication
- Environment-based configuration

## Implementation Plan

### Phase 1: Backend Authentication Infrastructure

#### 1.1 Dependencies Installation
```bash
cd backend
npm install passport passport-google-oauth20 jsonwebtoken express-session cookie-parser googleapis pg
# Note: socket.io already installed
```

#### 1.2 Database Schema Setup (`backend/db/schema.sql`)
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255), -- Optional: group messages by session
  INDEX idx_user_timestamp (user_id, timestamp DESC)
);

-- User preferences table (for model selection, etc.)
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  preferred_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

#### 1.3 Database Service (`backend/services/dbService.js`)
```javascript
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async createUser(googleProfile, tokens) {
    const query = `
      INSERT INTO users (google_id, email, name, access_token, refresh_token)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (google_id) 
      DO UPDATE SET 
        access_token = $4,
        refresh_token = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      googleProfile.id,
      googleProfile.emails[0].value,
      googleProfile.displayName,
      tokens.accessToken,
      tokens.refreshToken
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await this.pool.query(query, [googleId]);
    return result.rows[0];
  }

  async saveChatMessage(userId, message, response, model, sessionId = null) {
    const query = `
      INSERT INTO chat_messages (user_id, message, response, model, session_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [userId, message, response, model, sessionId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getChatHistory(userId, limit = 50, offset = 0) {
    const query = `
      SELECT message, response, model, timestamp, session_id
      FROM chat_messages 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.reverse(); // Return chronological order
  }

  async getUserPreferences(userId) {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserPreferences(userId, preferences) {
    const query = `
      INSERT INTO user_preferences (user_id, preferred_model, theme)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        preferred_model = $2,
        theme = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [userId, preferences.preferred_model, preferences.theme];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new DatabaseService();
```

#### 1.4 Google OAuth Service (`backend/services/googleAuth.js`)
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const dbService = require('./dbService');

class GoogleAuthService {
  constructor() {
    this.initializeStrategy();
  }

  initializeStrategy() {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks']
    }, this.handleGoogleCallback.bind(this)));
  }

  async handleGoogleCallback(accessToken, refreshToken, profile, done) {
    try {
      // Store user and tokens in database
      const user = await dbService.createUser(profile, { accessToken, refreshToken });
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }

  generateJWT(user) {
    return jwt.sign(
      { 
        userId: user.id, // Use database ID, not Google ID
        googleId: user.google_id,
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new GoogleAuthService();
```
#### 2.4 Google Tasks Service (`backend/services/tasksService.js`)
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

class GoogleAuthService {
  constructor() {
    this.initializeStrategy();
  }

  initializeStrategy() {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks']
    }, this.handleGoogleCallback.bind(this)));
  }

  async handleGoogleCallback(accessToken, refreshToken, profile, done) {
    // Store tokens and user info
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      accessToken,
      refreshToken
    };
    return done(null, user);
  }

  generateJWT(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}
```

#### 1.5 Authentication Routes (`backend/routes/auth.js`)
```javascript
const express = require('express');
const passport = require('passport');
const { GoogleAuthService } = require('../services/googleAuth');
const dbService = require('../services/dbService');

const router = express.Router();
const authService = new GoogleAuthService();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks']
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = authService.generateJWT(req.user);
    
    // Set httpOnly cookie for production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect(process.env.FRONTEND_URL);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    }
  }
);

// Get chat history
router.get('/chat/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const history = await dbService.getChatHistory(req.user.userId, limit, offset);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.clearCookie('authToken');
  }
  res.json({ success: true });
});

module.exports = router;
```
```javascript
const express = require('express');
const passport = require('passport');
const { GoogleAuthService } = require('../services/googleAuth');

const router = express.Router();
const authService = new GoogleAuthService();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks']
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = authService.generateJWT(req.user);
    
    // Store tokens in database (production) or memory (development)
    if (process.env.NODE_ENV === 'production') {
      await this.storeUserTokens(req.user);
    } else {
      global.userTokens = global.userTokens || {};
      global.userTokens[req.user.id] = {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken
      };
    }

    // Set httpOnly cookie for production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect(process.env.FRONTEND_URL);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    }
  }
);

// Logout endpoint
router.post('/logout', (req, res) => {
  // Clear stored tokens
  if (req.user && global.userTokens) {
    delete global.userTokens[req.user.id];
  }
  res.json({ success: true });
});

module.exports = router;
```

#### 1.6 JWT Middleware (`backend/middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');
const dbService = require('../services/dbService');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const getGoogleTokens = async (userId) => {
  const user = await dbService.getUserByGoogleId(userId);
  return user ? {
    accessToken: user.access_token,
    refreshToken: user.refresh_token
  } : null;
};

module.exports = { authenticateToken, getGoogleTokens };
```
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const getGoogleTokens = (userId) => {
  return global.userTokens && global.userTokens[userId];
};

module.exports = { authenticateToken, getGoogleTokens };
```

#### 1.5 Socket.io Authentication (`backend/middleware/socketAuth.js`)
```javascript
const jwt = require('jsonwebtoken');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  });
};

module.exports = { authenticateSocket };
```

### Phase 2: Google API Integration

#### 2.1 Google Calendar Service (`backend/services/calendarService.js`)
```javascript
const { google } = require('googleapis');
const { getGoogleTokens } = require('../middleware/auth');

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthenticatedClient(userId) {
    const tokens = getGoogleTokens(userId);
    if (!tokens) {
      throw new Error('User not authenticated');
    }
    
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
    
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async getEvents(userId, timeMin, timeMax) {
    const calendar = this.getAuthenticatedClient(userId);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return response.data.items;
  }

  async createEvent(userId, eventData) {
    const calendar = this.getAuthenticatedClient(userId);
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: eventData
    });
    return response.data;
  }
}

module.exports = { CalendarService };
```

#### 2.3 Update AI Service for User Context (`backend/services/aiService.js`)
```javascript
const dbService = require('./dbService');

class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
  }

  async getModels() {
    // Existing implementation unchanged
    const response = await fetch(`${this.baseURL}/v1/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    return response.json();
  }

  async sendMessage(message, model = 'gpt-4o-mini', userId = null, sessionId = null) {
    try {
      // Enhanced system prompt with user context
      const systemContent = userId 
        ? `You are AuraFlow, a mindful productivity assistant for user ${userId}. Keep responses concise and helpful. You have access to their calendar and tasks.`
        : 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.';

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ancestry-IsInternal': 'true',
          'Ancestry-ClientPath': 'auraflow',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemContent
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save chat message to database if user is authenticated
      if (userId) {
        await dbService.saveChatMessage(userId, message, aiResponse, model, sessionId);
      }

      return aiResponse;
    } catch (error) {
      console.error('LiteLLM API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
```
```javascript
class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
  }

  async getModels() {
    // Existing implementation unchanged
    const response = await fetch(`${this.baseURL}/v1/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    return response.json();
  }

  async sendMessage(message, model = 'gpt-4o-mini', userId = null) {
    try {
      // Enhanced system prompt with user context
      const systemContent = userId 
        ? `You are AuraFlow, a mindful productivity assistant for user ${userId}. Keep responses concise and helpful. You have access to their calendar and tasks.`
        : 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.';

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ancestry-IsInternal': 'true',
          'Ancestry-ClientPath': 'auraflow',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemContent
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('LiteLLM API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
```
```javascript
const { google } = require('googleapis');
const { getGoogleTokens } = require('../middleware/auth');

class TasksService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthenticatedClient(userId) {
    const tokens = getGoogleTokens(userId);
    if (!tokens) {
      throw new Error('User not authenticated');
    }
    
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
    
    return google.tasks({ version: 'v1', auth: this.oauth2Client });
  }

  async getTasks(userId, tasklistId = '@default') {
    const tasks = this.getAuthenticatedClient(userId);
    const response = await tasks.tasks.list({
      tasklist: tasklistId
    });
    return response.data.items;
  }

  async createTask(userId, taskData, tasklistId = '@default') {
    const tasks = this.getAuthenticatedClient(userId);
    const response = await tasks.tasks.insert({
      tasklist: tasklistId,
      resource: taskData
    });
    return response.data;
  }
}

module.exports = { TasksService };
```

### Phase 3: Frontend Authentication

#### 3.1 Auth Context (`frontend/src/contexts/AuthContext.jsx`)
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('authToken', urlToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      // Decode JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          name: payload.name
        });
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, [token]);

  const login = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3.2 Google Sign-In Component (`frontend/src/components/Auth/GoogleSignIn.jsx`)
```javascript
import { Button, Paper, Text, Stack } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

export const GoogleSignIn = () => {
  const { login } = useAuth();

  return (
    <Paper p="xl" radius="md" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Stack align="center" gap="md">
        <Text size="lg" fw={500}>Welcome to AuraFlow</Text>
        <Text size="sm" c="dimmed" ta="center">
          Sign in with Google to access your calendar and tasks
        </Text>
        <Button
          leftSection={<IconBrandGoogle size={16} />}
          onClick={login}
          size="md"
          fullWidth
        >
          Sign in with Google
        </Button>
      </Stack>
    </Paper>
  );
};
```

#### 3.3 Protected Route Component (`frontend/src/components/Auth/ProtectedRoute.jsx`)
```javascript
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignIn } from './GoogleSignIn';
import { Loader, Center } from '@mantine/core';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <GoogleSignIn />;
  }

  return children;
};
```

### Phase 4: Socket.io Integration

#### 4.1 Backend Socket Setup (Update existing `backend/server.js`)
```javascript
// Add to existing server.js
const passport = require('passport');
const { authenticateSocket } = require('./middleware/socketAuth');
const dbService = require('./services/dbService');

// Initialize passport (add after existing middleware)
app.use(passport.initialize());

// Update existing Socket.io setup with authentication
io.use(authenticateSocket);

// Update existing connection handler
io.on('connection', async (socket) => {
  console.log(`Authenticated user ${socket.user.email} connected:`, socket.id);
  
  // Generate session ID for this socket connection
  const sessionId = `session_${socket.id}_${Date.now()}`;

  // Send chat history on connection
  try {
    const chatHistory = await dbService.getChatHistory(socket.user.userId, 20);
    socket.emit('chat_history', chatHistory);
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }

  // Load user preferences for model selection
  try {
    const preferences = await dbService.getUserPreferences(socket.user.userId);
    const models = await aiService.getModels();
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: preferences?.preferred_model || models.data?.[0]?.id || 'gpt-4o-mini',
      user: socket.user
    });
  } catch (error) {
    // ... existing error handling
  }

  // Update existing chat_message handler with user context and persistence
  socket.on('chat_message', async (data) => {
    try {
      const { message, model } = data;
      const userId = socket.user.userId;
      
      // Send to LiteLLM with user context and session ID
      const aiResponse = await aiService.sendMessage(message, model, userId, sessionId);
      
      socket.emit('ai_response', {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      });
    } catch (error) {
      // ... existing error handling
    }
  });

  // Handle model preference updates
  socket.on('update_model_preference', async (data) => {
    try {
      const { model } = data;
      await dbService.updateUserPreferences(socket.user.userId, { 
        preferred_model: model 
      });
    } catch (error) {
      console.error('Failed to update model preference:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.email} disconnected:`, socket.id);
  });
});
```
```javascript
// Add to existing server.js
const passport = require('passport');
const { authenticateSocket } = require('./middleware/socketAuth');

// Initialize passport (add after existing middleware)
app.use(passport.initialize());

// Update existing Socket.io setup with authentication
io.use(authenticateSocket);

// Update existing connection handler
io.on('connection', async (socket) => {
  console.log(`Authenticated user ${socket.user.email} connected:`, socket.id);

  // Update existing models emission with user context
  try {
    const models = await aiService.getModels();
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: models.data?.[0]?.id || 'gpt-4o-mini',
      user: socket.user // Add user context
    });
  } catch (error) {
    // ... existing error handling
  }

  // Update existing chat_message handler with user context
  socket.on('chat_message', async (data) => {
    try {
      const { message, model } = data;
      const userId = socket.user.userId; // Use authenticated user ID
      
      // Send to LiteLLM with user context
      const aiResponse = await aiService.sendMessage(message, model, userId);
      
      socket.emit('ai_response', {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        userId
      });
    } catch (error) {
      // ... existing error handling
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.email} disconnected:`, socket.id);
  });
});
```

#### 4.2 Frontend Socket Hook (Update existing `frontend/src/hooks/useSocket.js`)
```javascript
import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

const MODEL_STORAGE_KEY = 'auraflow_selected_model';

export const useSocket = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect with authentication token
      connectSocket(token);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      
      const onModels = ({ models, initialModel, user: serverUser }) => {
        setModels(models || []);
        setSelectedModel(initialModel || 'gpt-4o-mini');
      };

      const onChatHistory = (history) => {
        setChatHistory(history);
      };

      const onAIResponse = (response) => {
        // Add new message to chat history
        setChatHistory(prev => [...prev, {
          message: response.userMessage || '',
          response: response.message,
          model: selectedModel,
          timestamp: response.timestamp
        }]);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('models', onModels);
      socket.on('chat_history', onChatHistory);
      socket.on('ai_response', onAIResponse);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('models', onModels);
        socket.off('chat_history', onChatHistory);
        socket.off('ai_response', onAIResponse);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, token]);

  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Update server-side preference
    socket.emit('update_model_preference', { model });
  };

  const sendMessage = (message) => {
    if (isAuthenticated) {
      socket.emit('chat_message', { message, model: selectedModel });
      
      // Optimistically add user message to history
      setChatHistory(prev => [...prev, {
        message,
        response: null, // Will be filled when AI responds
        model: selectedModel,
        timestamp: new Date().toISOString(),
        pending: true
      }]);
    }
  };

  const onAIResponse = (callback) => {
    socket.on('ai_response', callback);
    return () => socket.off('ai_response', callback);
  };

  return { 
    isConnected: isConnected && isAuthenticated, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange,
    chatHistory,
    user
  };
};
```
```javascript
import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

const MODEL_STORAGE_KEY = 'auraflow_selected_model';

export const useSocket = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect with authentication token
      connectSocket(token);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      const onModels = ({ models, initialModel, user: serverUser }) => {
        setModels(models || []);
        
        const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);
        const modelToUse = storedModel || initialModel || 'gpt-4o-mini';
        setSelectedModel(modelToUse);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('models', onModels);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('models', onModels);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, token]);

  const handleModelChange = (model) => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
    setSelectedModel(model);
  };

  const sendMessage = (message) => {
    if (isAuthenticated) {
      socket.emit('chat_message', { message, model: selectedModel });
    }
  };

  const onAIResponse = (callback) => {
    socket.on('ai_response', callback);
    return () => socket.off('ai_response', callback);
  };

  return { 
    isConnected: isConnected && isAuthenticated, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange,
    user
  };
};
```

### Phase 5: API Routes Protection

#### 5.1 Calendar Routes (`backend/routes/calendar.js`)
```javascript
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { CalendarService } = require('../services/calendarService');

const router = express.Router();
const calendarService = new CalendarService();

// All calendar routes require authentication
router.use(authenticateToken);

router.get('/events', async (req, res) => {
  try {
    const { timeMin, timeMax } = req.query;
    const events = await calendarService.getEvents(req.user.userId, timeMin, timeMax);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = await calendarService.createEvent(req.user.userId, req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 5.2 Tasks Routes (`backend/routes/tasks.js`)
```javascript
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { TasksService } = require('../services/tasksService');

const router = express.Router();
const tasksService = new TasksService();

// All task routes require authentication
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const tasks = await tasksService.getTasks(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = await tasksService.createTask(req.user.userId, req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Phase 6: Frontend API Integration

#### 6.1 API Service (`frontend/src/services/api.js`)
```javascript
import { useAuth } from '../contexts/AuthContext';

class ApiService {
  constructor(token) {
    this.baseURL = process.env.REACT_APP_API_URL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Calendar methods
  async getCalendarEvents(timeMin, timeMax) {
    return this.request(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`);
  }

  async createCalendarEvent(eventData) {
    return this.request('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Tasks methods
  async getTasks() {
    return this.request('/api/tasks');
  }

  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }
}

// Hook to use API service with authentication
export const useApi = () => {
  const { token } = useAuth();
  return new ApiService(token);
};
```

### Phase 7: App Integration

#### 7.1 Updated App.jsx
```javascript
import { useState } from 'react';
import { MantineProvider, ColorSchemeScript, AppShell } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Navigation/Header';
import { BottomTabs } from './components/Navigation/BottomTabs';
// ... other imports

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'calendar':
        return <CalendarView />;
      case 'tasks':
        return <TasksView />;
      case 'meditation':
        return <MeditationView />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <>
      <ColorSchemeScript defaultColorScheme="light" />
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthProvider>
          <ProtectedRoute>
            <AppShell
              header={{ height: 60 }}
              padding="md"
              style={{
                backgroundColor: colorScheme === 'dark' ? theme.other.backgroundDark : theme.other.backgroundLight,
                minHeight: '100vh'
              }}
            >
              <AppShell.Header>
                <Header />
              </AppShell.Header>
              
              <AppShell.Main style={{ paddingBottom: '80px' }}>
                {renderContent()}
              </AppShell.Main>
              
              <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </AppShell>
          </ProtectedRoute>
        </AuthProvider>
      </MantineProvider>
    </>
  );
}

export default App;
```

## Testing Strategy

### E2E Tests (Playwright)
```
/e2e/
├── auth.spec.js           # Complete OAuth flow testing
├── calendar-auth.spec.js  # Calendar API with authentication
├── tasks-auth.spec.js     # Tasks API with authentication
├── socket-auth.spec.js    # Socket.io authentication flow
└── fixtures/
    ├── testUser.js        # Test user data
    └── mockGoogleApi.js   # Mock Google API responses
```

### E2E Test Scenarios (Update existing Playwright tests)
- [ ] Google OAuth complete flow (sign-in → callback → authenticated state)
- [ ] **Authenticated chat flow** - Sign in, connect socket, send message, receive AI response
- [ ] Socket.io connection with JWT authentication  
- [ ] Protected API routes (calendar/tasks) with valid/invalid tokens
- [ ] **Model selection with user context** - Verify user-specific model preferences
- [ ] Token refresh and expiration handling
- [ ] Logout flow and token cleanup

### Unit Tests
- **Backend**: Test auth middleware, Google API services, JWT generation
- **Frontend**: Test auth context, protected routes, API service

### Test Files Structure
```
/e2e/
├── auth.spec.js
├── calendar-auth.spec.js
├── tasks-auth.spec.js
├── socket-auth.spec.js
└── fixtures/
    ├── testUser.js
    └── mockGoogleApi.js

backend/__tests__/
├── services/
│   ├── googleAuth.test.js
│   ├── calendarService.test.js
│   └── tasksService.test.js
├── middleware/
│   ├── auth.test.js
│   └── socketAuth.test.js
└── routes/
    ├── auth.test.js
    ├── calendar.test.js
    └── tasks.test.js

frontend/src/__tests__/
├── contexts/
│   └── AuthContext.test.jsx
├── components/Auth/
│   ├── GoogleSignIn.test.jsx
│   └── ProtectedRoute.test.jsx
└── services/
    └── api.test.js
```

## Security Considerations

### Token Management
- JWT tokens stored in httpOnly cookies for production security
- localStorage for development environment
- Token refresh mechanism for expired access tokens
- Secure token transmission over HTTPS

### API Security
- All sensitive routes protected with authentication middleware
- CORS properly configured for frontend domain
- Rate limiting on auth endpoints

### Google API Scopes
- Minimal required scopes: profile, email, calendar, tasks
- Proper error handling for API rate limits
- Token revocation on logout

## Deployment Considerations

### Environment Variables
```bash
# Production .env additions
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
GOOGLE_REDIRECT_URI=https://your-app.herokuapp.com/auth/google/callback
JWT_SECRET=secure_production_secret
FRONTEND_URL=https://your-app.herokuapp.com

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/auraflow
# For Heroku: postgres://user:pass@host:port/dbname

# Existing LLM Configuration
LLM_BASE_URL=your_litellm_endpoint
LLM_API_KEY=your_litellm_key
```

### Google Cloud Console Setup
1. Create OAuth 2.0 credentials
2. Add authorized domains
3. Configure consent screen
4. Enable Calendar and Tasks APIs

## Implementation Timeline

### Week 1: Backend Auth Foundation
- [ ] Install auth dependencies (passport, jwt, etc.)
- [ ] **Set up PostgreSQL database and schema**
- [ ] **Implement database service for users and chat messages**
- [ ] Implement Google OAuth service with database integration
- [ ] Create auth routes and middleware
- [ ] **Update existing Socket.io with authentication middleware**
- [ ] **Modify existing AI service for user context and message persistence**

### Week 2: Frontend Auth & API Integration  
- [ ] Build frontend auth context and components
- [ ] **Update existing useSocket hook for authentication and chat history**
- [ ] **Modify existing chat interface for authenticated users with message history**
- [ ] Implement Google Calendar/Tasks services
- [ ] Create protected API routes
- [ ] **Add chat history API endpoint**

### Week 3: E2E Testing & Production Setup
- [ ] **Update existing Playwright tests for authenticated flows with chat persistence**
- [ ] Test complete OAuth + chat + persistence integration
- [ ] Test Socket.io authentication scenarios
- [ ] **Set up Heroku Postgres for production**
- [ ] Implement httpOnly cookie authentication for production
- [ ] **Test chat message persistence across sessions**

This plan provides a complete authentication system that securely integrates Google OAuth with Express, Socket.io, and provides access to Google Calendar and Tasks APIs while maintaining the security and user experience requirements of the AuraFlow application.