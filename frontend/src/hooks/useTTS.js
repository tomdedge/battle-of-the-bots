import { useState, useEffect, useRef, useMemo } from 'react';

export const useTTS = (preferences = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
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

  // Force re-computation when preferences change
  useEffect(() => {
    console.log('useTTS: Preferences changed:', preferences);
  }, [preferences]);

  const selectedVoice = useMemo(() => {
    console.log('useTTS: Computing selectedVoice', { 
      tts_voice: preferences?.tts_voice, 
      voicesCount: voices?.length || 0,
      voices: voices?.map(v => v.name) || []
    });
    if (preferences?.tts_voice && preferences.tts_voice !== 'default' && voices && voices.length > 0) {
      const found = voices.find(voice => voice.name === preferences.tts_voice);
      console.log('useTTS: Selected voice:', found?.name);
      return found;
    }
    return null;
  }, [voices, preferences?.tts_voice]);

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply user preferences
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

  return {
    speakText,
    stopSpeaking,
    isPlaying,
    voices,
    isSupported: 'speechSynthesis' in window
  };
};