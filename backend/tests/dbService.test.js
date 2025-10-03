// Mock pg Pool before requiring dbService
const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    end: jest.fn()
  }))
}));

const dbService = require('../services/dbService');

describe('DatabaseService', () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 1,
        google_id: '123456',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const googleProfile = {
        id: '123456',
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
        photos: [{ value: 'http://example.com/photo.jpg' }]
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const result = await dbService.createUser(googleProfile, tokens);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['123456', 'test@example.com', 'Test User', 'http://example.com/photo.jpg', 'access-token', 'refresh-token']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await dbService.getUserById(1);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await dbService.getUserById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('saveChatMessage', () => {
    it('should save chat message', async () => {
      const mockMessage = {
        id: 1,
        user_id: 1,
        message: 'Hello',
        response: 'Hi there!',
        model: 'gpt-4o-mini'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockMessage]
      });

      const result = await dbService.saveChatMessage(1, 'Hello', 'Hi there!', 'gpt-4o-mini');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_messages'),
        [1, 'Hello', 'Hi there!', 'gpt-4o-mini', null]
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('updateUserTokens', () => {
    it('should update user tokens', async () => {
      const mockUser = {
        id: 1,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const tokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      };

      const result = await dbService.updateUserTokens(1, tokens);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [1, 'new-access-token', 'new-refresh-token']
      );
      expect(result).toEqual(mockUser);
    });
  });
});
