import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    autoConnect: true
  });
  
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
