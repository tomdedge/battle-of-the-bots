import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

const MODEL_STORAGE_KEY = 'auraflow_selected_model';

export const useSocket = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
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
            tts_enabled: serverUser.tts_enabled || false,
            tts_voice: serverUser.tts_voice || 'default',
            tts_rate: serverUser.tts_rate || 1.0,
            tts_pitch: serverUser.tts_pitch || 1.0
          };
          console.log('Setting TTS preferences:', ttsPrefs);
          setTtsPreferences(ttsPrefs);
        }
      };

      const onChatHistory = (history) => {
        setChatHistory(history);
      };

      const onChatHistoryCleared = () => {
        setChatHistory([]);
      };

      const onAIResponse = (response) => {
        // Update the last pending message with the AI response
        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].pending) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              response: response.message,
              pending: false,
              timestamp: response.timestamp
            };
          }
          return updated;
        });
      };

      if (socketInstance) {
        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('models', onModels);
        socketInstance.on('chat_history', onChatHistory);
        socketInstance.on('chat_history_cleared', onChatHistoryCleared);
        socketInstance.on('ai_response', onAIResponse);
      }

      return () => {
        if (socketInstance) {
          socketInstance.off('connect', onConnect);
          socketInstance.off('disconnect', onDisconnect);
          socketInstance.off('models', onModels);
          socketInstance.off('chat_history', onChatHistory);
          socketInstance.off('chat_history_cleared', onChatHistoryCleared);
          socketInstance.off('ai_response', onAIResponse);
        }
        disconnectSocket();
      };
    } else {
      // Clear state when not authenticated
      setIsConnected(false);
      setChatHistory([]);
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
      socket.emit('clear_chat_history');
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
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange,
    chatHistory,
    setChatHistory,
    clearChatHistory,
    regenerateResponse,
    user,
    ttsPreferences,
    updateTTSPreferences
  };
};
