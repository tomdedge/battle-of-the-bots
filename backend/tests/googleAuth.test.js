const googleAuthService = require('../services/googleAuth');
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

// Mock dbService
jest.mock('../services/dbService', () => ({
  createUser: jest.fn()
}));

const dbService = require('../services/dbService');

describe('GoogleAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGoogleCallback', () => {
    it('should create user and return success', async () => {
      const mockProfile = {
        id: '123456',
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User'
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const mockUser = {
        id: 1,
        google_id: '123456',
        email: 'test@example.com',
        name: 'Test User'
      };

      dbService.createUser.mockResolvedValueOnce(mockUser);

      const done = jest.fn();

      await googleAuthService.handleGoogleCallback(
        mockTokens.accessToken,
        mockTokens.refreshToken,
        mockProfile,
        done
      );

      expect(dbService.createUser).toHaveBeenCalledWith(mockProfile, mockTokens);
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle database errors', async () => {
      const mockProfile = {
        id: '123456',
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User'
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const error = new Error('Database error');
      dbService.createUser.mockRejectedValueOnce(error);

      const done = jest.fn();

      await googleAuthService.handleGoogleCallback(
        mockTokens.accessToken,
        mockTokens.refreshToken,
        mockProfile,
        done
      );

      expect(done).toHaveBeenCalledWith(error, null);
    });
  });

  describe('generateJWT', () => {
    it('should generate JWT token with user data', () => {
      const mockUser = {
        id: 1,
        google_id: '123456',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockToken = 'jwt-token';
      jwt.sign.mockReturnValueOnce(mockToken);

      const result = googleAuthService.generateJWT(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 1,
          googleId: '123456',
          email: 'test@example.com',
          name: 'Test User'
        },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });
  });
});
