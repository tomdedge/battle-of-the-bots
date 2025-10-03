const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req, res, next) => next()),
  initialize: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../services/googleAuth', () => ({
  generateJWT: jest.fn()
}));

jest.mock('../services/dbService', () => ({
  getChatHistory: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  })
}));

const passport = require('passport');
const googleAuthService = require('../services/googleAuth');
const dbService = require('../services/dbService');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock passport authenticate to return middleware function
    passport.authenticate.mockImplementation((strategy, options) => {
      return (req, res, next) => {
        if (strategy === 'google') {
          if (req.path === '/google/callback') {
            req.user = { id: 1, name: 'Test User' };
          }
          res.redirect('http://localhost:3000?token=test-token');
        } else {
          next();
        }
      };
    });
    
    const authRoutes = require('../routes/auth');
    app.use('/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('GET /auth/google', () => {
    it('should initiate Google OAuth', async () => {
      const response = await request(app)
        .get('/auth/google');

      expect(response.status).toBe(302);
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks'],
        accessType: 'offline',
        prompt: 'consent'
      });
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should handle OAuth callback', async () => {
      googleAuthService.generateJWT.mockReturnValue('test-jwt-token');
      process.env.NODE_ENV = 'development';
      process.env.FRONTEND_URL = 'http://localhost:3000';

      const response = await request(app)
        .get('/auth/google/callback');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('token=test-token');
    });
  });

  describe('GET /auth/chat/history', () => {
    it('should return chat history', async () => {
      const mockHistory = [
        { id: 1, message: 'Hello', response: 'Hi' }
      ];

      dbService.getChatHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/auth/chat/history')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
      expect(dbService.getChatHistory).toHaveBeenCalledWith(1, 50, 0);
    });

    it('should handle query parameters', async () => {
      dbService.getChatHistory.mockResolvedValue([]);

      await request(app)
        .get('/auth/chat/history?limit=10&offset=5')
        .expect(200);

      expect(dbService.getChatHistory).toHaveBeenCalledWith(1, 10, 5);
    });

    it('should handle service errors', async () => {
      dbService.getChatHistory.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/auth/chat/history')
        .expect(500);

      expect(response.body).toEqual({ error: 'DB error' });
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });
  });
});
