const { authenticateSocket } = require('../middleware/socketAuth');
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Socket Auth Middleware', () => {
  let socket, next;

  beforeEach(() => {
    socket = {
      handshake: {
        auth: {},
        headers: {}
      }
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token from auth', () => {
    const mockUser = { userId: 1, email: 'test@example.com' };
    
    socket.handshake.auth.token = 'valid-token';
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, mockUser);
    });

    authenticateSocket(socket, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
    expect(socket.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should reject if no token provided', () => {
    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith(new Error('Authentication error: No token provided'));
  });

  it('should reject invalid token', () => {
    socket.handshake.auth.token = 'invalid-token';
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith(new Error('Authentication error: Invalid token'));
  });
});
