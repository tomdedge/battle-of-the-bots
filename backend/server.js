const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

console.log('Environment variables loaded:');
console.log('LLM_BASE_URL:', process.env.LLM_BASE_URL);
console.log('LLM_API_KEY:', process.env.LLM_API_KEY ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

const aiService = require('./services/aiService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Send available models on connection with timeout
  try {
    const modelsPromise = aiService.getModels();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Models request timeout')), 5000)
    );
    
    const models = await Promise.race([modelsPromise, timeoutPromise]);
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: models.data?.[0]?.id || 'gpt-4o-mini' 
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
      initialModel: 'gpt-4o-mini' 
    });
  }

  socket.on('chat_message', async (data) => {
    try {
      const { message, model, userId = 'anonymous' } = data;
      
      // Send to LiteLLM with selected model
      const aiResponse = await aiService.sendMessage(message, model);
      
      // Send response back to client
      socket.emit('ai_response', {
        message: aiResponse,
        timestamp: new Date().toISOString()
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
