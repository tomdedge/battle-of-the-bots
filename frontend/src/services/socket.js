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
