const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Run migrations on startup
async function runMigrations() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(sql);
        console.log(`✓ Migration ${file} applied`);
      } catch (error) {
        console.log(`- Migration ${file} skipped (likely already applied)`);
      }
    }
  }
  await pool.end();
}

// Run migrations before starting server
runMigrations().then(() => {
  console.log('Database migrations completed');
}).catch(console.error);

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
const tasksRoutes = require('./routes/tasks');
const toolsRoutes = require('./routes/tools');
const ttsRoutes = require('./routes/tts');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000" }
});

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));

// Routes (must come BEFORE static middleware)
app.use('/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tts', ttsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (must come BEFORE static middleware)
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Privacy Policy - AuraFlow</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide when using our service, including Google account information for authentication and calendar/task integration.</p>
      <h2>How We Use Information</h2>
      <p>We use your information to provide and improve our AI assistant service, including calendar and task management features.</p>
      <h2>Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information.</p>
      <h2>Contact</h2>
      <p>For questions about this privacy policy, please contact us through our application.</p>
    </body></html>
  `);
});

app.get('/terms-of-service', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Terms of Service - AuraFlow</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
      <h2>Acceptance of Terms</h2>
      <p>By using AuraFlow, you agree to these terms of service.</p>
      <h2>Service Description</h2>
      <p>AuraFlow is an AI-powered personal assistant that helps with calendar management, task organization, and productivity.</p>
      <h2>User Responsibilities</h2>
      <p>You are responsible for maintaining the confidentiality of your account and for all activities under your account.</p>
      <h2>Limitation of Liability</h2>
      <p>The service is provided "as is" without warranties of any kind.</p>
      <h2>Contact</h2>
      <p>For questions about these terms, please contact us through our application.</p>
    </body></html>
  `);
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && 
        !req.path.startsWith('/auth/') && 
        !req.path.startsWith('/static/') && 
        !req.path.startsWith('/privacy') && 
        !req.path.startsWith('/terms-of-service')) {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    }
  });
}

// Verification function to check Aurora's work and assist with completion
async function verifyTaskScheduling(userId, originalMessage, aiResponse) {
  try {
    // Extract task name from the original message
    const taskMatch = originalMessage.match(/Task to schedule: "([^"]+)"/);
    if (!taskMatch) return;
    
    const taskName = taskMatch[1];
    console.log(`🔍 Verifying task scheduling for: "${taskName}"`);
    
    // Get today's calendar events to check Aurora's work
    const calendarService = require('./services/calendarService');
    const tasksService = require('./services/tasksService');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const events = await calendarService.getEvents(userId, startOfDay.toISOString(), endOfDay.toISOString());
    
    // Check if Aurora created the calendar event
    const scheduledEvent = events.find(event => 
      event.summary && event.summary.toLowerCase().includes(taskName.toLowerCase())
    );
    
    let eventCreated = !!scheduledEvent;
    let taskUpdated = false;
    
    // Check if Aurora updated the task title
    try {
      const allTasks = await tasksService.getTasks(userId);
      const targetTask = allTasks.find(task => 
        task.title && (
          task.title.toLowerCase() === `[scheduled] ${taskName.toLowerCase()}` ||
          task.title.toLowerCase() === taskName.toLowerCase()
        )
      );
      taskUpdated = targetTask && targetTask.title.toLowerCase().includes('[scheduled]');
    } catch (taskCheckError) {
      console.log(`⚠️  Could not check task status: ${taskCheckError.message}`);
    }
    
    console.log(`📊 Aurora's performance: Event created: ${eventCreated}, Task updated: ${taskUpdated}`);
    
    // If Aurora didn't create the event, help her out
    if (!eventCreated) {
      console.log(`🤖 Aurora didn't create calendar event, assisting...`);
      
      // Find next available 30-minute slot (Aurora's logic would be smarter, but this is our fallback)
      const now = new Date();
      let startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0); // Default to 9 AM
      
      // If it's already past 9 AM, start from current time rounded up to next 30-min interval
      if (now > startTime) {
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 30) * 30;
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), roundedMinutes);
        if (roundedMinutes >= 60) {
          startTime.setHours(startTime.getHours() + 1, 0);
        }
      }
      
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      
      try {
        const eventData = {
          summary: taskName,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          description: `Task scheduled with Aurora's assistance`
        };
        
        await calendarService.createEvent(userId, eventData);
        console.log(`✅ Assisted Aurora by creating calendar event: "${taskName}" at ${startTime.toLocaleTimeString()}`);
        eventCreated = true;
      } catch (calendarError) {
        console.log(`❌ Failed to assist with calendar event: ${calendarError.message}`);
      }
    } else {
      console.log(`✅ Aurora successfully created calendar event: "${scheduledEvent.summary}"`);
    }
    
    // If Aurora didn't update the task title, help her out
    if (eventCreated && !taskUpdated) {
      console.log(`🤖 Aurora didn't update task title, assisting...`);
      try {
        await tasksService.updateTaskByName(userId, taskName, {
          title: `[Scheduled] ${taskName}`
        });
        console.log(`✅ Assisted Aurora by updating task title to: "[Scheduled] ${taskName}"`);
        taskUpdated = true;
      } catch (taskError) {
        console.log(`❌ Failed to assist with task update: ${taskError.message}`);
      }
    } else if (taskUpdated) {
      console.log(`✅ Aurora successfully updated task title`);
    }
    
    // Log final status
    if (eventCreated && taskUpdated) {
      console.log(`🎉 Task scheduling completed successfully (Aurora + assistance)`);
    } else if (eventCreated) {
      console.log(`⚠️  Partial success: Event created but task not updated`);
    } else {
      console.log(`❌ Task scheduling failed completely`);
    }
    
  } catch (error) {
    console.error('❌ Task verification error:', error.message);
  }
}

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`Authenticated user ${socket.user.email} connected:`, socket.id);
  
  // Generate session ID for this socket connection
  const sessionId = `session_${socket.id}_${Date.now()}`;

  // Send messages on connection
  try {
    const messages = await dbService.getMessages(socket.user.userId, 50);
    socket.emit('messages', messages);
  } catch (error) {
    console.error('Failed to load messages:', error);
  }

  // Load user preferences and send models
  try {
    const preferences = await dbService.getUserPreferences(socket.user.userId);
    const modelsPromise = aiService.getModels();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Models request timeout')), 5000)
    );
    
    const models = await Promise.race([modelsPromise, timeoutPromise]);
    const firstAvailableModel = models.data?.[0]?.id;
    
    if (!firstAvailableModel) {
      throw new Error('No models available from API');
    }
    
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: preferences?.preferred_model || firstAvailableModel,
      user: {
        ...socket.user,
        tts_enabled: preferences?.tts_enabled,
        tts_voice: preferences?.tts_voice,
        tts_rate: preferences?.tts_rate,
        tts_pitch: preferences?.tts_pitch
      }
    });
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    // Try to get models one more time without timeout
    try {
      const models = await aiService.getModels();
      const firstAvailableModel = models.data?.[0]?.id;
      
      if (firstAvailableModel) {
        socket.emit('models', { 
          models: models.data || [], 
          initialModel: firstAvailableModel,
          user: {
            ...socket.user,
            tts_enabled: false,
            tts_voice: 'default',
            tts_rate: 1.0,
            tts_pitch: 1.0
          }
        });
      } else {
        throw new Error('No models in API response');
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError.message);
      socket.emit('error', { message: 'Unable to load available models' });
    }
  }

  socket.on('chat_message', async (data) => {
    try {
      const { message, model } = data;
      const userId = socket.user.userId;
      
      // Save user message
      await dbService.saveMessage(userId, message, 'user', model, sessionId);
      
      // Send to LiteLLM with user context and session ID
      const aiResponse = await aiService.sendMessage(message, model, userId, sessionId);
      
      console.log('🔍 aiResponse type:', typeof aiResponse);
      console.log('🔍 aiResponse content:', aiResponse);
      
      // Only save aurora message if we have a valid response
      const responseContent = typeof aiResponse === 'string' ? aiResponse : aiResponse?.message;
      if (responseContent && responseContent.trim()) {
        await dbService.saveMessage(userId, responseContent, 'aurora', model, sessionId);
      } else {
        console.error('❌ NO VALID RESPONSE CONTENT:', {
          aiResponseType: typeof aiResponse,
          aiResponseValue: aiResponse,
          responseContent: responseContent,
          hasMessage: !!(aiResponse?.message),
          messageValue: aiResponse?.message
        });
      }
      
      // Only send response to client if we have valid content
      if (responseContent && responseContent.trim()) {
        console.log('✅ Sending valid response to client:', {
          messageLength: responseContent.length,
          hasToolResults: !!(typeof aiResponse === 'object' ? aiResponse.toolResults : false)
        });
        
        // Send response back to client
        socket.emit('ai_response', {
          message: responseContent,
          toolResults: typeof aiResponse === 'object' ? aiResponse.toolResults : undefined,
          timestamp: new Date().toISOString(),
          userId,
          sessionId
        });
      } else {
        console.error('❌ NOT SENDING EMPTY RESPONSE TO CLIENT');
      }
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('ai_response', {
        message: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date().toISOString(),
        userId: socket.user.userId,
        sessionId
      });
    }
  });

  // Separate event for task scheduling that doesn't store in chat history
  socket.on('task_message', async (data) => {
    try {
      const { message, model } = data;
      const userId = socket.user.userId;
      
      // Send to LiteLLM with user context and session ID, skip history storage
      const aiResponse = await aiService.sendMessage(message, model, userId, sessionId, true);
      
      // Verify if Aurora actually scheduled the task
      await verifyTaskScheduling(userId, message, aiResponse);
      
      // Send response back to client with different event name
      socket.emit('task_response', {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      });
    } catch (error) {
      console.error('Task message error:', error);
      socket.emit('task_response', {
        message: 'Sorry, I encountered an error processing your task.',
        timestamp: new Date().toISOString(),
        userId: socket.user.userId,
        sessionId
      });
    }
  });

  socket.on('inject_aurora_message', async (data) => {
    try {
      const { message } = data;
      const userId = socket.user.userId;
      
      // Save to NEW messages table
      const savedMessage = await dbService.saveMessage(
        userId, 
        message, 
        'aurora', 
        'aurora-inject', 
        sessionId
      );
      
      // Emit to all connected clients for this user
      io.to(`user_${userId}`).emit('ai_response', {
        message: message,
        timestamp: savedMessage.timestamp,
        userId,
        sessionId
      });
      
      console.log(`📤 Injected Aurora message (NEW TABLE) for user ${userId}:`, message.substring(0, 100) + '...');
    } catch (error) {
      console.error('Inject Aurora message error:', error);
      socket.emit('error', { message: 'Failed to inject Aurora message' });
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

  // Handle TTS preference updates
  socket.on('update_tts_preference', async (data) => {
    try {
      await dbService.updateUserPreferences(socket.user.userId, data);
    } catch (error) {
      console.error('Failed to update TTS preference:', error);
    }
  });

  // Handle TTS generation requests
  socket.on('tts_request', async (data) => {
    console.log('🎤 TTS request received:', { text: data.text?.substring(0, 50) + '...', voice: data.voice, requestId: data.requestId });
    try {
      const { text, voice, requestId } = data;
      const ttsService = require('./services/ttsService');
      
      console.log('🎤 Attempting TTS generation with edge-tts...');
      // Generate speech using Edge-TTS
      const audioBuffer = await ttsService.generateSpeech(text, voice);
      
      console.log('🎤 TTS generation successful, sending audio buffer of size:', audioBuffer.length);
      // Send audio back to client
      socket.emit('tts_response', { 
        audio: audioBuffer.toString('base64'),
        success: true,
        requestId
      });
    } catch (error) {
      console.error('🎤 TTS generation failed:', error.message);
      // Send fallback signal to client
      socket.emit('tts_response', { 
        success: false, 
        fallback: true,
        error: 'Server TTS unavailable: ' + error.message,
        requestId: data.requestId
      });
    }
  });

  // Handle message clearing
  socket.on('clear_messages', async () => {
    try {
      await dbService.clearMessages(socket.user.userId);
      socket.emit('messages_cleared');
    } catch (error) {
      console.error('Failed to clear messages:', error);
      socket.emit('error', { message: 'Failed to clear messages' });
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
