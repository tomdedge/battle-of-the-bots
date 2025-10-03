import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

describe('useSpeechRecognition Hook', () => {
  let mockRecognition;
  let mockOnComplete;

  beforeEach(() => {
    mockOnComplete = jest.fn();
    
    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      onresult: null,
      onend: null,
      onerror: null
    };

    // Mock SpeechRecognition
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;
  });

  it('initializes with correct default values when supported', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.isSupported).toBe(true);
    expect(typeof result.current.startListening).toBe('function');
    expect(typeof result.current.stopListening).toBe('function');
  });

  it('initializes as not supported when SpeechRecognition unavailable', () => {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    expect(result.current.isSupported).toBe(false);
  });

  it('configures recognition correctly', () => {
    renderHook(() => useSpeechRecognition(mockOnComplete));

    expect(global.SpeechRecognition).toHaveBeenCalled();
    expect(mockRecognition.continuous).toBe(true);
    expect(mockRecognition.interimResults).toBe(true);
    expect(mockRecognition.lang).toBe('en-US');
  });

  it('starts listening', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
    expect(result.current.transcript).toBe('');
  });

  it('does not start if already listening', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    mockRecognition.start.mockClear();

    act(() => {
      result.current.startListening();
    });

    expect(mockRecognition.start).not.toHaveBeenCalled();
  });

  it('stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it('handles speech results with final transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    // Simulate speech result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'hello world' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    expect(result.current.transcript).toBe('hello world');
  });

  it('handles speech results with interim transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    // Simulate interim result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'hello' },
          isFinal: false
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    expect(result.current.transcript).toBe('hello');
  });

  it('calls onComplete after silence timeout', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    // Simulate final speech result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'test message' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    // Fast-forward timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockOnComplete).toHaveBeenCalledWith('test message');
    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it('clears timeout on new speech', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    // First result
    const mockEvent1 = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'hello' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent1);
    });

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Second result should clear timeout
    const mockEvent2 = {
      resultIndex: 1,
      results: [
        {
          0: { transcript: 'hello' },
          isFinal: true
        },
        {
          0: { transcript: ' world' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent2);
    });

    // Advance remaining time from first timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not have called onComplete yet
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Advance full timeout from second result
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockOnComplete).toHaveBeenCalledWith('hello world');
  });

  it('handles recognition end event', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.onend();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('calls onComplete on end if text available', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    // Add some text
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'fallback test' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    // End recognition before timeout
    act(() => {
      mockRecognition.onend();
    });

    expect(mockOnComplete).toHaveBeenCalledWith('fallback test');
  });

  it('handles recognition error', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.onerror();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('prevents duplicate onComplete calls', () => {
    const { result } = renderHook(() => useSpeechRecognition(mockOnComplete));

    act(() => {
      result.current.startListening();
    });

    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'duplicate test' },
          isFinal: true
        }
      ]
    };

    act(() => {
      mockRecognition.onresult(mockEvent);
    });

    // Trigger timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Try to trigger onend
    act(() => {
      mockRecognition.onend();
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('duplicate test');
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSpeechRecognition(mockOnComplete));

    unmount();

    expect(mockRecognition.abort).toHaveBeenCalled();
  });
});