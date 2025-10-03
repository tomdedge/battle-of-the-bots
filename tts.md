# Text-to-Speech (TTS) Implementation Plan for AuraFlow

## Overview
Add TTS functionality to AuraFlow to allow users to hear AI responses read aloud. This will enhance accessibility and provide a more engaging user experience.

## Research: TTS Options

### 1. Web Speech API (Browser Native)
- **Pros**: No server setup, works offline, free
- **Cons**: Limited voice quality, browser-dependent, inconsistent across platforms
- **Implementation**: `window.speechSynthesis.speak()`

### 2. Edge-TTS (Microsoft Edge TTS)
- **Pros**: High-quality voices, free, many language options
- **Cons**: Requires server-side implementation, unofficial API
- **Implementation**: Python package `edge-tts` on backend

### 3. Google Cloud Text-to-Speech
- **Pros**: Excellent quality, official API, many voices
- **Cons**: Costs money, requires API key
- **Implementation**: REST API calls

### 4. OpenAI TTS
- **Pros**: Very natural voices, part of OpenAI ecosystem
- **Cons**: Costs money, requires API key
- **Implementation**: REST API calls

## Recommended Approach: Hybrid Solution

### Phase 1: Web Speech API (Quick Implementation)
Start with browser-native TTS for immediate functionality, then enhance with server-side options.

### Phase 2: Edge-TTS Backend (Enhanced Quality)
Add server-side edge-tts for better voice quality while keeping Web Speech API as fallback.

## Implementation Plan

### Frontend Changes

#### 1. Add TTS Hook (`useTTS.js`)
```javascript
// Location: frontend/src/hooks/useTTS.js
export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // Web Speech API implementation
  const speakText = (text) => { /* ... */ };
  const stopSpeaking = () => { /* ... */ };
  
  // Server-side TTS implementation
  const speakWithEdgeTTS = async (text) => { /* ... */ };
  
  return { speakText, stopSpeaking, isPlaying, voices };
};
```

#### 2. Update MessageBubble Component
```javascript
// Add microphone icon to AI messages
// Location: frontend/src/components/Chat/MessageBubble.jsx

import { IconMicrophone, IconPlayerStop } from '@tabler/icons-react';
import { useTTS } from '../../hooks/useTTS';

// Add TTS button to AI messages only
{!isUser && (
  <ActionIcon
    size="sm"
    variant="subtle"
    onClick={() => isPlaying ? stopSpeaking() : speakText(message)}
    style={{ position: 'absolute', bottom: 8, right: 8 }}
  >
    {isPlaying ? <IconPlayerStop size={16} /> : <IconMicrophone size={16} />}
  </ActionIcon>
)}
```

#### 3. TTS Settings Component
```javascript
// Location: frontend/src/components/Settings/TTSSettings.jsx
// Allow users to:
// - Enable/disable TTS
// - Select voice (Web Speech API voices)
// - Choose TTS provider (Web API vs Server)
// - Adjust speech rate and pitch
```

### Backend Changes

#### 1. Install Edge-TTS
```bash
# Add to backend/package.json
npm install edge-tts
# Or use Python subprocess if needed
```

#### 2. TTS Service
```javascript
// Location: backend/services/ttsService.js
class TTSService {
  async generateSpeech(text, voice = 'en-US-AriaNeural') {
    // Use edge-tts to generate audio
    // Return audio buffer or stream
  }
  
  async getAvailableVoices() {
    // Return list of available edge-tts voices
  }
}
```

#### 3. TTS Routes
```javascript
// Location: backend/routes/tts.js
// POST /api/tts/speak - Generate speech from text
// GET /api/tts/voices - Get available voices
```

#### 4. Socket.io Integration
```javascript
// Add to backend/server.js
socket.on('tts_request', async (data) => {
  const { text, voice } = data;
  const audioBuffer = await ttsService.generateSpeech(text, voice);
  socket.emit('tts_response', { audio: audioBuffer });
});
```

### Database Changes

#### 1. User Preferences Table
```sql
-- Add TTS preferences to user_preferences table
ALTER TABLE user_preferences ADD COLUMN tts_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN tts_voice VARCHAR(100) DEFAULT 'en-US-AriaNeural';
ALTER TABLE user_preferences ADD COLUMN tts_rate DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_preferences ADD COLUMN tts_pitch DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_preferences ADD COLUMN tts_provider VARCHAR(20) DEFAULT 'web';
```

## Implementation Steps

### Step 1: Basic Web Speech API (1-2 hours)
1. Create `useTTS` hook with Web Speech API
2. Add microphone icon to MessageBubble for AI messages
3. Implement basic speak/stop functionality
4. Test cross-browser compatibility

### Step 2: TTS Settings (1 hour)
1. Create TTS settings component
2. Add to user preferences
3. Save settings to database
4. Load settings on app start

### Step 3: Edge-TTS Backend (2-3 hours)
1. Set up edge-tts service on backend
2. Create TTS routes and socket handlers
3. Implement audio streaming/buffering
4. Add fallback to Web Speech API

### Step 4: Enhanced UI (1 hour)
1. Add loading states during TTS generation
2. Show speaking indicator
3. Add keyboard shortcuts (spacebar to play/pause)
4. Improve accessibility

### Step 5: Testing & Polish (1 hour)
1. Test on different browsers and devices
2. Handle edge cases (long messages, special characters)
3. Optimize audio caching
4. Add error handling

## Technical Considerations

### Audio Format
- **Web Speech API**: No audio file, direct browser synthesis
- **Edge-TTS**: MP3 or WAV output, stream to frontend
- **Caching**: Cache generated audio for repeated messages

### Performance
- **Chunking**: Split long messages into smaller chunks
- **Streaming**: Stream audio as it's generated
- **Preloading**: Pre-generate TTS for likely responses

### Accessibility
- **ARIA labels**: Proper labeling for screen readers
- **Keyboard navigation**: Tab to TTS buttons, spacebar to activate
- **Visual indicators**: Clear play/pause states

### Error Handling
- **Fallback chain**: Edge-TTS → Web Speech API → Silent failure
- **Network issues**: Handle offline scenarios
- **Rate limiting**: Prevent TTS spam

## File Structure
```
frontend/src/
├── hooks/
│   └── useTTS.js
├── components/
│   ├── Chat/
│   │   └── MessageBubble.jsx (updated)
│   └── Settings/
│       └── TTSSettings.jsx
└── services/
    └── ttsService.js

backend/
├── services/
│   └── ttsService.js
├── routes/
│   └── tts.js
└── server.js (updated)
```

## Future Enhancements
1. **Voice Cloning**: Custom voice training
2. **SSML Support**: Advanced speech markup
3. **Emotion Detection**: Adjust voice tone based on message sentiment
4. **Multi-language**: Automatic language detection and voice switching
5. **Offline Mode**: Download voices for offline use

## Estimated Timeline
- **Phase 1 (Web Speech API)**: 3-4 hours
- **Phase 2 (Edge-TTS Backend)**: 4-5 hours
- **Total**: 7-9 hours for complete implementation

## Success Metrics
- Users can click microphone icon to hear AI responses
- TTS works across major browsers (Chrome, Firefox, Safari)
- Settings are persistent across sessions
- Fallback system handles edge cases gracefully
- Accessibility standards are met