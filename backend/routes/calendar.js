const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.use(authenticateToken);

router.get('/events', async (req, res) => {
  try {
    console.log('Calendar events request:', {
      userId: req.user.userId,
      query: req.query
    });
    
    const { start, end } = req.query;
    const events = await calendarService.getEvents(req.user.userId, start, end);
    
    console.log(`Retrieved ${events.length} events for user ${req.user.userId}`);
    res.json({ events });
  } catch (error) {
    console.error('Calendar events error:', {
      userId: req.user.userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

router.get('/analyze', async (req, res) => {
  try {
    const { date } = req.query;
    const gaps = await calendarService.analyzeCalendarGaps(
      req.user.userId, 
      date ? new Date(date) : new Date()
    );
    const suggestions = gaps.map(gap => calendarService.suggestFocusBlock(gap));
    res.json({ gaps, suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/focus-block', async (req, res) => {
  try {
    const event = await calendarService.createEvent(req.user.userId, req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;