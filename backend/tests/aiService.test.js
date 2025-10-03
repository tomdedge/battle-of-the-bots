// Mock dependencies
jest.mock('../services/dbService', () => ({
  saveChatMessage: jest.fn(),
  getUserById: jest.fn(),
  getChatHistory: jest.fn()
}));

jest.mock('../tools', () => ({
  getAllToolDefinitions: jest.fn(() => []),
  executeTool: jest.fn()
}));

const aiService = require('../services/aiService');
const dbService = require('../services/dbService');

// Mock fetch globally
global.fetch = jest.fn();

describe('AIService', () => {
  beforeEach(() => {
    fetch.mockClear();
    dbService.getUserById.mockClear();
    dbService.getChatHistory.mockClear();
    dbService.saveChatMessage.mockClear();
    // Clear cached models
    aiService.cachedModels = null;
  });

  describe('getModels', () => {
    it('should fetch available models', async () => {
      const mockResponse = {
        data: [
          { id: 'gpt-4o-mini' },
          { id: 'gpt-4o' }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await aiService.getModels();

      expect(fetch).toHaveBeenCalledWith(
        'http://test-llm.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return cached models on second call', async () => {
      const mockResponse = {
        data: [{ id: 'gpt-4o-mini' }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      await aiService.getModels();
      // Second call should use cache
      const result = await aiService.getModels();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should send simple message and return AI response', async () => {
      // Mock database calls
      dbService.getUserById.mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      });
      dbService.getChatHistory.mockResolvedValueOnce([]);
      dbService.saveChatMessage.mockResolvedValueOnce({});

      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello! How can I help you today?',
            tool_calls: null
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await aiService.sendMessage('Hello', 'gpt-4o-mini', 1);

      expect(fetch).toHaveBeenCalledWith(
        'http://test-llm.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key'
          })
        })
      );
      expect(result).toBe('Hello! How can I help you today?');
    });

    it('should handle API response errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Server error' } })
      });

      await expect(aiService.sendMessage('Hello')).rejects.toThrow('AI service unavailable');
    });

    it('should handle malformed API responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      });

      await expect(aiService.sendMessage('Hello')).rejects.toThrow('AI service unavailable');
    });
  });
});
