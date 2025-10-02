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
