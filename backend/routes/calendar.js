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
    const { date, days = 1 } = req.query;
    const baseDate = date ? new Date(date) : new Date();
    const daysToAnalyze = Math.min(parseInt(days) || 1, 7); // Limit to 7 days max
    
    console.log(`Analyzing ${daysToAnalyze} days starting from ${baseDate.toDateString()}`);
    
    const allGaps = [];
    const allSuggestions = [];
    
    for (let i = 0; i < daysToAnalyze; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i);
      
      const gaps = await calendarService.analyzeCalendarGaps(req.user.userId, currentDate);
      const suggestions = gaps.map(gap => ({
        ...calendarService.suggestFocusBlock(gap),
        date: currentDate.toDateString()
      }));
      
      allGaps.push(...gaps);
      allSuggestions.push(...suggestions);
    }
    
    console.log(`Total suggestions across ${daysToAnalyze} days: ${allSuggestions.length}`);
    res.json({ gaps: allGaps, suggestions: allSuggestions });
  } catch (error) {
    console.error('Calendar analysis error:', error);
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