import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const TTSContext = createContext();

export const TTSProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [preferences, setPreferences] = useState({});
  const utteranceRef = useRef(null);

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

  const selectedVoice = useMemo(() => {
    if (preferences?.tts_voice && preferences.tts_voice !== 'default' && voices.length > 0) {
      return voices.find(voice => voice.name === preferences.tts_voice);
    }
    return null;
  }, [voices, preferences?.tts_voice]);

  const speakText = (text) => {
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

  const stopSpeaking = () => {
    speechSynthesis.cancel();
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
