const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };
      
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header malformed', () => {
      req.headers.authorization = 'InvalidFormat';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Bearer token with proper format', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };
      
      req.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'test-secret',
        expect.any(Function)
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });
});
