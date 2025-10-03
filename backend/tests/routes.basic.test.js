const request = require('supertest');
const express = require('express');

// Mock all dependencies
jest.mock('../services/calendarService');
jest.mock('../services/tasksService');
jest.mock('../services/ttsService');
jest.mock('../services/dbService');
jest.mock('../middleware/auth');

const calendarService = require('../services/calendarService');
const tasksService = require('../services/tasksService');
const ttsService = require('../services/ttsService');
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');

describe('Routes Basic Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 1 };
      next();
    });
    
    jest.clearAllMocks();
  });

  describe('Calendar Routes', () => {
    beforeEach(() => {
      const calendarRoutes = require('../routes/calendar');
      app.use('/api/calendar', calendarRoutes);
    });

    it('should handle GET /events', async () => {
      calendarService.getEvents = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/calendar/events?start=2023-10-01&end=2023-10-02');

      expect(response.status).toBe(200);
      expect(calendarService.getEvents).toHaveBeenCalled();
    });

    it('should handle POST /focus-block', async () => {
      calendarService.createEvent = jest.fn().mockResolvedValue({ id: 'test' });

      const response = await request(app)
        .post('/api/calendar/focus-block')
        .send({ title: 'Test' });

      expect(response.status).toBe(200);
      expect(calendarService.createEvent).toHaveBeenCalled();
    });
  });

  describe('Tasks Routes', () => {
    beforeEach(() => {
      const tasksRoutes = require('../routes/tasks');
      app.use('/api/tasks', tasksRoutes);
    });

    it('should handle GET /lists', async () => {
      tasksService.getTaskLists = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tasks/lists');

      expect(response.status).toBe(200);
      expect(tasksService.getTaskLists).toHaveBeenCalled();
    });

    it('should handle GET /', async () => {
      tasksService.getTasks = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(tasksService.getTasks).toHaveBeenCalled();
    });
  });

  describe('TTS Routes', () => {
    beforeEach(() => {
      const ttsRoutes = require('../routes/tts');
      app.use('/api/tts', ttsRoutes);
    });

    it('should handle POST /speak', async () => {
      ttsService.generateSpeech = jest.fn().mockResolvedValue(Buffer.from('audio'));

      const response = await request(app)
        .post('/api/tts/speak')
        .send({ text: 'Hello' });

      expect(response.status).toBe(200);
      expect(ttsService.generateSpeech).toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      const response = await request(app)
        .post('/api/tts/speak')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
