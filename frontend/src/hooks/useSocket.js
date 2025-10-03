import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

const MODEL_STORAGE_KEY = 'auraflow_selected_model';

export const useSocket = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ttsPreferences, setTtsPreferences] = useState({});

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect with authentication token
      const socketInstance = connectSocket(token);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      
      const onModels = ({ models, initialModel, user: serverUser }) => {
        console.log('Received models event:', { models, initialModel, serverUser });
        setModels(models || []);
        setSelectedModel(initialModel);
        // Extract TTS preferences from user data
        if (serverUser) {
          const ttsPrefs = {
            tts_enabled: serverUser.tts_enabled !== false, // Default to true
            tts_voice: serverUser.tts_voice || 'default',
            tts_rate: serverUser.tts_rate || 1.0,
            tts_pitch: serverUser.tts_pitch || 1.0
          };
          console.log('Setting TTS preferences:', ttsPrefs);
          setTtsPreferences(ttsPrefs);
        }
      };

      const onMessages = (messageList) => {
        setMessages(messageList);
      };

      const onMessagesCleared = () => {
        setMessages([]);
      };

      const onAIResponse = (response) => {
        // Add single aurora message
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: response.message,
          sender: 'aurora',
          timestamp: response.timestamp,
          model: response.model || selectedModel
        }]);
      };

      if (socketInstance) {
        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('models', onModels);
        socketInstance.on('messages', onMessages);
        socketInstance.on('messages_cleared', onMessagesCleared);
      }

      return () => {
        if (socketInstance) {
          socketInstance.off('connect', onConnect);
          socketInstance.off('disconnect', onDisconnect);
          socketInstance.off('models', onModels);
          socketInstance.off('messages', onMessages);
          socketInstance.off('messages_cleared', onMessagesCleared);
        }
        disconnectSocket();
      };
    } else {
      // Clear state when not authenticated
      setIsConnected(false);
      setMessages([]);
      setModels([]);
    }
  }, [isAuthenticated, token]);

  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Update server-side preference
    if (socket && socket.connected) {
      socket.emit('update_model_preference', { model });
    }
  };

  const sendMessage = (message) => {
    if (isAuthenticated && socket && socket.connected) {
      socket.emit('chat_message', { message, model: selectedModel });
      
      // Add user message immediately
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        pending: true
      }]);
    }
  };

  const sendTaskMessage = (message, callback) => {
    if (isAuthenticated && socket && socket.connected) {
      // Send message using separate event that doesn't store in chat history
      socket.emit('task_message', { message, model: selectedModel });
      
      // Set up one-time listener for task response
      const handleTaskResponse = (response) => {
        callback(response);
        socket.off('task_response', handleTaskResponse);
      };
      
      socket.on('task_response', handleTaskResponse);
    }
  };

  const sendAuroraMessage = (message) => {
    if (isAuthenticated && socket && socket.connected) {
      // Add Aurora's message directly to chat history without user message
      const auroraMessage = {
        message: '', // No user message
        response: message, // Aurora's message as response
        model: selectedModel,
        timestamp: new Date().toISOString(),
        pending: false
      };
      
      setChatHistory(prev => [...prev, auroraMessage]);
    }
  };

  const injectAuroraMessage = (message) => {
    if (isAuthenticated && socket && socket.connected) {
      console.log('📤 Injecting Aurora message via socket:', message.substring(0, 100) + '...');
      socket.emit('inject_aurora_message', { message });
    } else {
      console.log('❌ Cannot inject Aurora message - not connected or authenticated');
    }
  };

  const onAIResponse = (callback) => {
    if (socket) {
      socket.on('ai_response', callback);
      return () => {
        if (socket) {
          socket.off('ai_response', callback);
        }
      };
    }
    return () => {};
  };

  const clearChatHistory = () => {
    if (socket && socket.connected) {
      socket.emit('clear_messages');
    }
  };

  const regenerateResponse = (originalMessage) => {
    if (socket && socket.connected) {
      // Send message without adding to history
      socket.emit('chat_message', { message: originalMessage, model: selectedModel });
    }
  };

  const updateTTSPreferences = (preferences) => {
    console.log('updateTTSPreferences called with:', preferences);
    setTtsPreferences(prev => {
      const updated = { ...prev, ...preferences };
      console.log('TTS preferences updated from', prev, 'to', updated);
      return updated;
    });
    // Force a re-render by updating the preferences again with a new object reference
    setTimeout(() => {
      setTtsPreferences(current => ({ ...current }));
    }, 0);
    if (socket && socket.connected) {
      socket.emit('update_tts_preference', preferences);
    }
  };

  return { 
    isConnected: isConnected && isAuthenticated, 
    sendMessage, 
    sendTaskMessage,
    sendAuroraMessage,
    injectAuroraMessage,
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange,
    messages,
    setMessages,
    clearChatHistory,
    regenerateResponse,
    user,
    ttsPreferences,
    updateTTSPreferences
  };
};
