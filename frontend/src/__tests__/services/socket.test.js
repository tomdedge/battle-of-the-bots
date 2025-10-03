import { connectSocket, disconnectSocket, socket } from '../../services/socket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('Socket Service', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      connected: false,
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };

    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up global socket
    if (global.window && global.window.auraflowSocket) {
      delete global.window.auraflowSocket;
    }
  });

  describe('connectSocket', () => {
    it('creates new socket connection', () => {
      const token = 'test-token';
      const result = connectSocket(token);

      expect(io).toHaveBeenCalledWith('http://localhost:8080', {
        auth: { token },
        autoConnect: true
      });
      expect(result).toBe(mockSocket);
      expect(global.window.auraflowSocket).toBe(mockSocket);
    });

    it('uses custom API URL from environment', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://custom-api.com';

      connectSocket('token');

      expect(io).toHaveBeenCalledWith('https://custom-api.com', expect.any(Object));

      // Restore original env
      process.env.REACT_APP_API_URL = originalEnv;
    });

    it('disconnects existing socket before creating new one', () => {
      mockSocket.connected = true;
      
      // First connection
      connectSocket('token1');
      
      // Second connection should disconnect first
      connectSocket('token2');

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(io).toHaveBeenCalledTimes(2);
    });

    it('does not disconnect if socket not connected', () => {
      mockSocket.connected = false;
      
      connectSocket('token1');
      connectSocket('token2');

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('disconnectSocket', () => {
    it('disconnects connected socket', () => {
      mockSocket.connected = true;
      connectSocket('token');
      
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('does nothing if socket not connected', () => {
      mockSocket.connected = false;
      connectSocket('token');
      
      disconnectSocket();

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('does nothing if no socket exists', () => {
      expect(() => disconnectSocket()).not.toThrow();
    });
  });

  describe('socket export', () => {
    it('exports socket instance', () => {
      expect(socket).toBeNull();
      
      connectSocket('token');
      
      // Socket should be updated after connection
      expect(socket).toBe(mockSocket);
    });
  });
});