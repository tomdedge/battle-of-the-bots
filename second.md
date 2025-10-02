# AuraFlow - Second Phase: Chat Interface Implementation

## Goal
Replace the ChatPlaceholder with a functional chat interface that connects to the backend LiteLLM service via Socket.io. Focus on minimal, clean implementation.

## Implementation Scope

### Backend Updates
```
/backend
├── server.js              # Add Socket.io + LiteLLM integration
├── services/
│   └── aiService.js       # LiteLLM client wrapper
├── package.json           # Add socket.io, axios
└── .env                   # Add LLM_BASE_URL, LLM_API_KEY
```

### Frontend Updates
```
/frontend/src
├── components/
│   └── Chat/
│       ├── ChatInterface.jsx    # Replace placeholder
│       ├── MessageBubble.jsx    # Individual message component
│       └── ChatInput.jsx        # Input field + send button
├── hooks/
│   └── useSocket.js            # Socket connection hook
├── services/
│   └── socket.js               # Socket.io client setup
└── App.jsx                     # Add socket provider
```

## Backend Implementation

### Updated server.js
```javascript
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const aiService = require('./services/aiService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Send available models on connection
  try {
    const models = await aiService.getModels();
    socket.emit('models', { 
      models: models.data || [], 
      initialModel: models.data?.[0]?.id || 'gpt-4o-mini' 
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    socket.emit('models', { models: [], initialModel: 'gpt-4o-mini' });
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
```

### services/aiService.js
```javascript
class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
  }

  async getModels() {
    const response = await fetch(`${this.baseURL}/v1/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    return response.json();
  }

  async sendMessage(message, model = 'gpt-4o-mini') {
    try {
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
              content: 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.'
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

### Updated backend package.json
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "socket.io": "^4.7.2"
  }
}
```

## Frontend Implementation

### services/socket.js
```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const socket = io(SOCKET_URL, {
  autoConnect: false
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
```

### hooks/useSocket.js
```javascript
import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

const MODEL_STORAGE_KEY = 'auraflow_selected_model';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

  useEffect(() => {
    connectSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onModels = ({ models, initialModel }) => {
      setModels(models || []);
      
      // Check localStorage first, then fallback to initialModel
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
  }, []);

  const handleModelChange = (model) => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
    setSelectedModel(model);
  };

  const sendMessage = (message) => {
    socket.emit('chat_message', { message, model: selectedModel });
  };

  const onAIResponse = (callback) => {
    socket.on('ai_response', callback);
    return () => socket.off('ai_response', callback);
  };

  return { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange 
  };
};
```

### components/Chat/MessageBubble.jsx
```javascript
import { Paper, Text, Box } from '@mantine/core';

export const MessageBubble = ({ message, isUser, timestamp, error }) => {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px'
      }}
    >
      <Paper
        p="sm"
        style={{
          maxWidth: '80%',
          backgroundColor: isUser 
            ? 'var(--mantine-color-aura-1)' 
            : error 
              ? 'var(--mantine-color-red-1)'
              : 'var(--mantine-color-gray-1)',
          color: isUser ? 'white' : 'var(--mantine-color-text)'
        }}
      >
        <Text size="sm">{message}</Text>
        {timestamp && (
          <Text size="xs" c="dimmed" mt={4}>
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        )}
      </Paper>
    </Box>
  );
};
```

### components/Chat/ChatInput.jsx
```javascript
import { useState } from 'react';
import { TextInput, ActionIcon, Group } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="xs">
        <TextInput
          flex={1}
          placeholder="Ask AuraFlow anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        <ActionIcon
          type="submit"
          variant="filled"
          color="aura.1"
          disabled={!message.trim() || disabled}
        >
          <IconSend size={16} />
        </ActionIcon>
      </Group>
    </form>
  );
};
```

### components/Chat/ChatInterface.jsx
```javascript
import { useState, useEffect, useRef } from 'react';
import { Stack, ScrollArea, Text, Loader, Center, Select } from '@mantine/core';
import { useSocket } from '../../hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

export const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel 
  } = useSocket();
  const scrollAreaRef = useRef();

  useEffect(() => {
    const cleanup = onAIResponse((response) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: response.message,
        isUser: false,
        timestamp: response.timestamp,
        error: response.error
      }]);
      setIsLoading(false);
    });

    return cleanup;
  }, [onAIResponse]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const handleSendMessage = (message) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      message,
      isUser: true,
      timestamp: new Date().toISOString()
    }]);

    // Send to backend
    sendMessage(message);
    setIsLoading(true);
  };

  return (
    <Stack h="100%" gap={0}>
      <ScrollArea flex={1} p="md" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <Center h="100%">
            <Text c="dimmed">Start a conversation with AuraFlow</Text>
          </Center>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))
        )}
        {isLoading && (
          <Center mt="md">
            <Loader size="sm" />
          </Center>
        )}
      </ScrollArea>
      
      <Stack p="md" gap="xs">
        {!isConnected && (
          <Text size="xs" c="red">Connecting...</Text>
        )}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isLoading}
        />
        <Select
          label="Model"
          placeholder="Select model"
          data={models.map(m => ({ value: m.id, label: m.id }))}
          value={selectedModel}
          onChange={setSelectedModel}
          size="xs"
        />
      </Stack>
    </Stack>
  );
};
```

### Updated frontend package.json
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@mantine/core": "^7.0.0",
    "@mantine/hooks": "^7.0.0",
    "@tabler/icons-react": "^2.40.0",
    "socket.io-client": "^4.7.2"
  }
}
```

## Environment Variables

### backend/.env
```bash
PORT=8080
LLM_API_KEY=sk-1pidoLiwLhID7rvOgDgt9g
LLM_BASE_URL=https://internal-ai-gateway.ancestryl1.int
```

### frontend/.env
```bash
REACT_APP_API_URL=http://localhost:8080
```

## Testing the Implementation

### Manual Testing Steps
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Navigate to Chat tab
4. Send a message and verify AI response

### Expected Behavior
- Messages appear in chat bubbles (user on right, AI on left)
- Loading indicator shows while waiting for AI response
- Connection status displays if socket disconnects
- Error messages show if AI service fails
- Auto-scroll to latest messages

## Success Criteria
- [ ] Socket.io connection established between frontend/backend
- [ ] Messages sent from chat input reach LiteLLM
- [ ] AI responses display in chat interface
- [ ] Error handling works when LiteLLM is unavailable
- [ ] Chat history persists during session
- [ ] Mobile-responsive chat layout

## Next Steps (Third Phase)
1. Add message persistence (local storage)
2. Implement typing indicators
3. Add calendar tool integration to AI service
4. Create calendar analysis prompts
5. Build focus block suggestion UI

## Key Design Decisions

**Why Socket.io over REST?**
- Real-time responses feel more conversational
- Enables future features like typing indicators
- Better for streaming AI responses

**Why minimal message storage?**
- Session-only storage keeps it simple
- No database complexity in MVP
- Easy to add persistence later

**Why separate MessageBubble component?**
- Reusable for different message types
- Easy to add features like reactions
- Clean separation of concerns
