const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dbService = require('../services/dbService');
const router = express.Router();

// Simple in-memory cache for avatars
const avatarCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

router.get('/avatar/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `avatar_${userId}`;
    
    // Check cache first
    const cached = avatarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }
    
    // Get user's profile picture URL from database
    const user = await dbService.getUserById(userId);
    if (!user?.picture) {
      return res.status(404).json({ error: 'Avatar not found' });
    }
    
    // Fetch from Google
    const fetch = require('node-fetch');
    const response = await fetch(user.picture);
    if (!response.ok) {
      throw new Error('Failed to fetch avatar from Google');
    }
    
    const buffer = await response.buffer();
    
    // Cache the result
    avatarCache.set(cacheKey, {
      buffer,
      timestamp: Date.now()
    });
    
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
    
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(404).json({ error: 'Avatar not found' });
  }
});

module.exports = router;