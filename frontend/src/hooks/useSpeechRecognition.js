import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (onComplete) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const completedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
        
        setTranscript(finalTranscriptRef.current + interimTranscript);
        
        // Clear existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Set timeout for 2 seconds after any speech
        silenceTimeoutRef.current = setTimeout(() => {
          const finalText = finalTranscriptRef.current.trim();
          console.log('Timeout triggered, finalText:', finalText);
          if (finalText && onComplete && !completedRef.current) {
            console.log('Calling onComplete with:', finalText);
            completedRef.current = true;
            recognition.stop();
            onComplete(finalText);
          }
        }, 2000);
      };

      recognition.onend = () => {
        console.log('Recognition ended');
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Fallback: if we have text but onComplete wasn't called, call it now
        const finalText = finalTranscriptRef.current.trim();
        if (finalText && onComplete && !completedRef.current) {
          console.log('Calling fallback onComplete with:', finalText);
          completedRef.current = true;
          onComplete(finalText);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      finalTranscriptRef.current = '';
      completedRef.current = false;
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening
  };
};