import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  
  const socketConfig = {
    autoConnect: true,
    withCredentials: true, // Include cookies
  };
  
  // In development, use token auth. In production, rely on httpOnly cookies
  if (process.env.NODE_ENV !== 'production' && token) {
    socketConfig.auth = { token: token };
  }
  
  socket = io(SOCKET_URL, socketConfig);
  
  // Expose socket globally for TTS context
  window.auraflowSocket = socket;
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
};
