// Test setup and global mocks
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.LLM_API_KEY = 'test-key';
process.env.LLM_BASE_URL = 'http://test-llm.com';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8080/auth/google/callback';

// Mock console.log to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
