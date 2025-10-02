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
      const socketInstance = connectSocket(token);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      
      const onModels = ({ models, initialModel, user: serverUser }) => {
        setModels(models || []);
        setSelectedModel(initialModel || 'gpt-4o-mini');
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

  return { 
    isConnected: isConnected && isAuthenticated, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel: handleModelChange,
    chatHistory,
    setChatHistory,
    clearChatHistory,
    regenerateResponse,
    user
  };
};
