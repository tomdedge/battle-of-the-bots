const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.use(authenticateToken);

router.get('/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    const events = await calendarService.getEvents(req.user.userId, start, end);
    res.json({ events });
  } catch (error) {
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