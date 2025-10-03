import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const TTSContext = createContext();

export const TTSProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [preferences, setPreferences] = useState(() => {
    // Load preferences from localStorage on init
    const saved = localStorage.getItem('tts_preferences');
    return saved ? JSON.parse(saved) : { tts_enabled: true };
  });
  const [socket, setSocket] = useState(null);
  const [serverTTSInProgress, setServerTTSInProgress] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const currentRequestIdRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        console.log('🎤 Web Speech API voices loaded:', availableVoices.length);
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Periodic sync to catch any missed state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        syncAudioState();
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Get socket from window (set by useSocket hook)
  useEffect(() => {
    const checkSocket = () => {
      if (window.auraflowSocket) {
        console.log('🎤 Socket found and connected:', window.auraflowSocket.connected);
        setSocket(window.auraflowSocket);
        
        // Listen for TTS responses
        window.auraflowSocket.on('tts_response', (data) => {
          console.log('🎤 === SOCKET RESPONSE RECEIVED ===');
          console.log('🎤 TTS response received:', { 
            success: data.success, 
            error: data.error, 
            requestId: data.requestId, 
            isStopped,
            hasCurrentRequest: !!currentRequestIdRef.current
          });
          
          // Don't play if user has stopped
          if (isStopped) {
            console.log('🎤 Ignoring TTS response - user stopped audio');
            return;
          }
          
          // Only process if we have a pending request
          if (!currentRequestIdRef.current) {
            console.log('🎤 Ignoring TTS response - no pending request');
            return;
          }
          
          console.log('🎤 Processing TTS response');
          setServerTTSInProgress(false);
          currentRequestIdRef.current = null;
          
          if (data.success) {
            console.log('🎤 Playing server-generated audio');
            playAudioBuffer(data.audio);
          } else {
            console.log('🎤 Server TTS failed, no fallback available');
            setIsPlaying(false); // Reset state on failure
          }
        });

        // Handle socket disconnect during TTS
        window.auraflowSocket.on('disconnect', () => {
          console.log('🎤 Socket disconnected during TTS');
          if (serverTTSInProgress) {
            console.log('🎤 Server TTS interrupted by disconnect');
            setServerTTSInProgress(false);
            setIsPlaying(false);
          }
        });
      } else {
        console.log('🎤 Socket not yet available, retrying...');
        setTimeout(checkSocket, 1000);
      }
    };
    
    checkSocket();
  }, []);

  const selectedVoice = useMemo(() => {
    if (preferences?.tts_voice && preferences.tts_voice !== 'default' && voices.length > 0) {
      return voices.find(voice => voice.name === preferences.tts_voice);
    }
    return null;
  }, [voices, preferences?.tts_voice]);

  // Sync React state with actual audio state
  const syncAudioState = () => {
    const actuallyPlaying = audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.readyState > 0;
    console.log('🎤 Syncing audio state:', { 
      actuallyPlaying: !!actuallyPlaying, // Convert to boolean
      currentState: isPlaying,
      hasAudio: !!audioRef.current,
      paused: audioRef.current?.paused,
      ended: audioRef.current?.ended,
      readyState: audioRef.current?.readyState
    });
    
    // Only sync if we're not in a user-initiated state change
    if (!serverTTSInProgress && actuallyPlaying !== isPlaying) {
      console.log('🎤 State mismatch detected, updating from', isPlaying, 'to', actuallyPlaying);
      setIsPlaying(!!actuallyPlaying); // Ensure boolean
    }
  };

  const playAudioBuffer = (base64Audio) => {
    try {
      // Stop any Web Speech API first
      speechSynthesis.cancel();
      
      // Convert base64 to blob more safely
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      audioRef.current = new Audio(audioUrl);
      
      // Bind audio events - but be careful about pause events
      audioRef.current.onplay = () => {
        console.log('🎤 Audio onplay event');
        setIsPlaying(true); // Confirm playing state
      };
      audioRef.current.onpause = () => {
        console.log('🎤 Audio onpause event');
        // Only set to false if audio actually ended or was stopped by user
        if (audioRef.current && audioRef.current.ended) {
          setIsPlaying(false);
        }
      };
      audioRef.current.onended = () => {
        console.log('🎤 Audio onended event');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      audioRef.current.onerror = () => {
        console.log('Audio playback failed, no fallback available');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      audioRef.current.onloadstart = () => console.log('🎤 Audio loading...');
      audioRef.current.oncanplay = () => console.log('🎤 Audio can play');
      
      audioRef.current.play().catch(error => {
        console.log('Audio play failed, no fallback available');
        syncAudioState();
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      });
    } catch (error) {
      console.log('Audio buffer processing failed, no fallback available');
      syncAudioState();
    }
  };

  const speakWithWebAPI = (text) => {
    if (!('speechSynthesis' in window)) return;

    // Stop any current speech
    speechSynthesis.cancel();
    
    // Stop any audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

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
    console.log('🎤 === TTS BUTTON CLICKED ===');
    console.log('🎤 TTS speakText called with:', { 
      text: text.substring(0, 50) + '...', 
      socketConnected: socket?.connected, 
      serverTTSInProgress,
      isPlaying,
      isStopped
    });
    
    // Prevent multiple requests - check if already in progress
    if (serverTTSInProgress) {
      console.log('🎤 TTS already in progress, stopping instead');
      stopSpeaking();
      return;
    }
    
    // Check if audio is actually playing
    const actuallyPlaying = audioRef.current && !audioRef.current.paused && !audioRef.current.ended;
    
    if (actuallyPlaying) {
      console.log('🎤 Audio already playing, stopping instead');
      stopSpeaking();
      return;
    }
    
    // Immediately set playing state for responsive UI
    console.log('🎤 Setting isPlaying to true and isStopped to false');
    setIsPlaying(true);
    setIsStopped(false); // Clear stop flag when starting new audio
    
    window.lastTTSText = text; // Store for reference
    
    // Only use server-side TTS
    if (socket && socket.connected) {
      console.log('🎤 Using server TTS with voice:', preferences?.tts_voice);
      const requestId = Date.now().toString();
      console.log('🎤 Generated requestId:', requestId);
      currentRequestIdRef.current = requestId;
      setServerTTSInProgress(true);
      console.log('🎤 EMITTING tts_request to socket');
      socket.emit('tts_request', { 
        text, 
        voice: preferences?.tts_voice || 'en-US-AriaNeural',
        requestId
      });
      console.log('🎤 Socket emit completed');
    } else {
      console.log('🎤 Socket not available, TTS unavailable');
      setIsPlaying(false); // Reset state if no socket
    }
  };

  const stopSpeaking = () => {
    console.log('🎤 === STOP BUTTON CLICKED ===');
    console.log('🎤 Stopping all TTS - current state:', { isPlaying, serverTTSInProgress, isStopped });
    
    // Set stop flag to prevent any pending audio from playing
    setIsStopped(true);
    
    // Immediately set state for responsive UI
    setIsPlaying(false);
    setServerTTSInProgress(false);
    currentRequestIdRef.current = null;
    
    // Stop Web Speech API (just in case)
    speechSynthesis.cancel();
    
    // Stop audio playback
    if (audioRef.current) {
      console.log('🎤 Stopping audio playback');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Clean up the audio element
      const audioUrl = audioRef.current.src;
      audioRef.current = null;
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    } else {
      console.log('🎤 No audio to stop');
    }
    
    console.log('🎤 Stop completed');
  };

  const updatePreferences = (newPrefs) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    // Save to localStorage
    localStorage.setItem('tts_preferences', JSON.stringify(updatedPrefs));
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
