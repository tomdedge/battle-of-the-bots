const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
require('dotenv').config();

console.log('Environment variables loaded:');
console.log('LLM_BASE_URL:', process.env.LLM_BASE_URL);
console.log('LLM_API_KEY:', process.env.LLM_API_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

const aiService = require('./services/aiService');
const dbService = require('./services/dbService');
const { authenticateSocket } = require('./middleware/socketAuth');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000" }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection handling
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

  // Load user preferences and send models
  try {
    const preferences = await dbService.getUserPreferences(socket.user.userId);
    const modelsPromise = aiService.getModels();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Models request timeout')), 5000)
    );
    
    const models = await Promise.race([modelsPromise, timeoutPromise]);
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: preferences?.preferred_model || models.data?.[0]?.id || 'gpt-4o-mini',
      user: socket.user
    });
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    // Fallback with common models
    socket.emit('models', { 
      models: [
        { id: 'gpt-4o-mini' },
        { id: 'gpt-4o' },
        { id: 'gpt-3.5-turbo' }
      ], 
      initialModel: 'gpt-4o-mini',
      user: socket.user
    });
  }

  socket.on('chat_message', async (data) => {
    try {
      const { message, model } = data;
      const userId = socket.user.userId;
      
      // Send to LiteLLM with user context and session ID
      const aiResponse = await aiService.sendMessage(message, model, userId, sessionId);
      
      // Send response back to client
      socket.emit('ai_response', {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      });
    } catch (error) {
      console.error('Chat error:', error);
      socket.emit('ai_response', {
        message: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString(),
        error: true
      });
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

  // Calendar events
  socket.on('calendar_sync_request', async () => {
    try {
      const calendarService = require('./services/calendarService');
      const today = new Date().toISOString().split('T')[0];
      const gaps = await calendarService.analyzeCalendarGaps(socket.user.userId, new Date());
      const suggestions = gaps.map(gap => calendarService.suggestFocusBlock(gap));
      
      socket.emit('calendar_suggestions', {
        gaps,
        suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('calendar_error', { error: error.message });
    }
  });

  socket.on('focus_block_approved', async (data) => {
    try {
      const calendarService = require('./services/calendarService');
      const event = await calendarService.createEvent(socket.user.userId, data.focusBlock);
      socket.emit('focus_block_created', { event, timestamp: new Date().toISOString() });
    } catch (error) {
      socket.emit('calendar_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.email} disconnected:`, socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
