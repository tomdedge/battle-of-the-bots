import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../../hooks/useTTS';

// Mock Web Speech API
const mockSpeak = jest.fn();
const mockCancel = jest.fn();

global.speechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  onstart: null,
  onend: null,
  onerror: null
}));

describe('useTTS Hook', () => {
  beforeEach(() => {
    mockSpeak.mockClear();
    mockCancel.mockClear();
  });

  it('returns speak and stop functions', () => {
    const { result } = renderHook(() => useTTS());
    
    expect(typeof result.current.speakText).toBe('function');
    expect(typeof result.current.stopSpeaking).toBe('function');
    expect(result.current.isPlaying).toBe(false);
  });

  it('calls speechSynthesis.speak when speak is called', () => {
    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speakText('Hello world');
    });
    
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('calls speechSynthesis.cancel when stop is called', () => {
    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.stopSpeaking();
    });
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});