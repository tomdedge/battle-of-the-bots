import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const TTSContext = createContext();

export const TTSProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [socket, setSocket] = useState(null);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Get socket from window (set by useSocket hook)
  useEffect(() => {
    if (window.auraflowSocket) {
      setSocket(window.auraflowSocket);
      
      // Listen for TTS responses
      window.auraflowSocket.on('tts_response', (data) => {
        if (data.success) {
          playAudioBuffer(data.audio);
        } else {
          // Fallback to Web Speech API
          console.log('Server TTS failed, using Web Speech API fallback');
          speakWithWebAPI(window.lastTTSText);
        }
      });
    }
  }, []);

  const selectedVoice = useMemo(() => {
    if (preferences?.tts_voice && preferences.tts_voice !== 'default' && voices.length > 0) {
      return voices.find(voice => voice.name === preferences.tts_voice);
    }
    return null;
  }, [voices, preferences?.tts_voice]);

  const playAudioBuffer = (base64Audio) => {
    try {
      const audioBlob = new Blob([
        new Uint8Array(atob(base64Audio).split('').map(c => c.charCodeAt(0)))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        // Fallback to Web Speech API
        speakWithWebAPI(window.lastTTSText);
      };
      
      audioRef.current.play();
    } catch (error) {
      console.error('Failed to play audio buffer:', error);
      speakWithWebAPI(window.lastTTSText);
    }
  };

  const speakWithWebAPI = (text) => {
    if (!('speechSynthesis' in window)) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = preferences?.tts_rate || 1.0;
    utterance.pitch = preferences?.tts_pitch || 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  const speakText = (text) => {
    window.lastTTSText = text; // Store for fallback
    
    // Try server-side TTS first if socket is available
    if (socket && socket.connected && preferences?.tts_provider === 'server') {
      socket.emit('tts_request', { 
        text, 
        voice: preferences?.tts_voice || 'en-US-AriaNeural' 
      });
    } else {
      // Use Web Speech API
      speakWithWebAPI(text);
    }
  };

  const stopSpeaking = () => {
    // Stop Web Speech API
    speechSynthesis.cancel();
    
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
  };

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <TTSContext.Provider value={{
      speakText,
      stopSpeaking,
      isPlaying,
      voices,
      preferences,
      updatePreferences,
      isSupported: 'speechSynthesis' in window
    }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};
