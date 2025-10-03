const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');

// Generate speech from text
router.post('/speak', async (req, res) => {
  try {
    const { text, voice = 'en-US-AriaNeural' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    const audioBuffer = await ttsService.generateSpeech(text, voice);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      fallback: true // Indicate client should use Web Speech API
    });
  }
});

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    const voices = await ttsService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Failed to get voices:', error);
    res.status(500).json({ 
      error: 'Failed to get voices',
      fallback: true
    });
  }
});

module.exports = router;
