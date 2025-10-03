const express = require('express');
const passport = require('passport');
const googleAuthService = require('../services/googleAuth');
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  // Force consent to get refresh token
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = googleAuthService.generateJWT(req.user);
    
    // Set httpOnly cookie for production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect(process.env.FRONTEND_URL);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    }
  }
);

// Get chat history
router.get('/chat/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const history = await dbService.getChatHistory(req.user.userId, parseInt(limit), parseInt(offset));
    res.json(history);
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all chat history
router.delete('/chat/history', authenticateToken, async (req, res) => {
  try {
    await dbService.clearChatHistory(req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete individual chat message
router.delete('/chat/message/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    await dbService.deleteChatMessage(req.user.userId, messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete individual message (new format)
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    await dbService.deleteMessage(req.user.userId, messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.clearCookie('authToken');
  }
  res.json({ success: true });
});

module.exports = router;