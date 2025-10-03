// Audio utility functions for testing
export const createAudioContext = () => {
  if (typeof AudioContext !== 'undefined') {
    return new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    return new webkitAudioContext();
  }
  return null;
};

export const loadAudioBuffer = async (audioContext, url) => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Failed to load audio buffer:', error);
    return null;
  }
};

export const playAudioBuffer = (audioContext, audioBuffer, volume = 1.0, loop = false) => {
  if (!audioContext || !audioBuffer) return null;

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = audioBuffer;
  source.loop = loop;
  gainNode.gain.value = Math.max(0, Math.min(1, volume));

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start();
  return source;
};

export const stopAudioSource = (audioSource) => {
  if (audioSource) {
    try {
      audioSource.stop();
    } catch (error) {
      // Source might already be stopped
    }
  }
};

export const fadeAudio = (gainNode, targetVolume, duration = 1000) => {
  if (!gainNode) return;

  const currentTime = gainNode.context.currentTime;
  const currentVolume = gainNode.gain.value;
  
  gainNode.gain.cancelScheduledValues(currentTime);
  gainNode.gain.setValueAtTime(currentVolume, currentTime);
  gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);
};

describe('Audio Utilities', () => {
  // Mock Web Audio API
  beforeAll(() => {
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createBufferSource: jest.fn(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
      })),
      createGain: jest.fn(() => ({
        gain: {
          value: 1,
          cancelScheduledValues: jest.fn(),
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn()
        },
        connect: jest.fn(),
        context: {
          currentTime: 0
        }
      })),
      decodeAudioData: jest.fn(),
      destination: {},
      currentTime: 0
    }));

    global.webkitAudioContext = global.AudioContext;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    delete global.AudioContext;
    delete global.webkitAudioContext;
    delete global.fetch;
  });

  describe('createAudioContext', () => {
    it('creates AudioContext when available', () => {
      const context = createAudioContext();
      expect(context).toBeDefined();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('falls back to webkitAudioContext', () => {
      delete global.AudioContext;
      
      const context = createAudioContext();
      expect(context).toBeDefined();
      
      // Restore for other tests
      global.AudioContext = global.webkitAudioContext;
    });

    it('returns null when no AudioContext available', () => {
      delete global.AudioContext;
      delete global.webkitAudioContext;
      
      const context = createAudioContext();
      expect(context).toBeNull();
      
      // Restore for other tests
      global.AudioContext = jest.fn().mockImplementation(() => ({}));
      global.webkitAudioContext = global.AudioContext;
    });
  });

  describe('loadAudioBuffer', () => {
    it('loads audio buffer successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockAudioBuffer = { length: 1024 };
      
      global.fetch.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const mockContext = {
        decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer)
      };

      const result = await loadAudioBuffer(mockContext, 'test.mp3');
      
      expect(fetch).toHaveBeenCalledWith('test.mp3');
      expect(mockContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
      expect(result).toBe(mockAudioBuffer);
    });

    it('handles fetch errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockContext = { decodeAudioData: jest.fn() };
      const result = await loadAudioBuffer(mockContext, 'test.mp3');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load audio buffer:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles decode errors', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      
      global.fetch.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const mockContext = {
        decodeAudioData: jest.fn().mockRejectedValue(new Error('Decode error'))
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await loadAudioBuffer(mockContext, 'test.mp3');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load audio buffer:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('playAudioBuffer', () => {
    it('plays audio buffer with default settings', () => {
      const mockSource = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn()
      };

      const mockGainNode = {
        gain: { value: 1 },
        connect: jest.fn()
      };

      const mockContext = {
        createBufferSource: jest.fn(() => mockSource),
        createGain: jest.fn(() => mockGainNode),
        destination: {}
      };

      const mockBuffer = { length: 1024 };
      
      const result = playAudioBuffer(mockContext, mockBuffer);
      
      expect(mockContext.createBufferSource).toHaveBeenCalled();
      expect(mockContext.createGain).toHaveBeenCalled();
      expect(mockSource.buffer).toBe(mockBuffer);
      expect(mockSource.loop).toBe(false);
      expect(mockGainNode.gain.value).toBe(1);
      expect(mockSource.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockContext.destination);
      expect(mockSource.start).toHaveBeenCalled();
      expect(result).toBe(mockSource);
    });

    it('plays audio buffer with custom settings', () => {
      const mockSource = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn()
      };

      const mockGainNode = {
        gain: { value: 1 },
        connect: jest.fn()
      };

      const mockContext = {
        createBufferSource: jest.fn(() => mockSource),
        createGain: jest.fn(() => mockGainNode),
        destination: {}
      };

      const mockBuffer = { length: 1024 };
      
      playAudioBuffer(mockContext, mockBuffer, 0.5, true);
      
      expect(mockSource.loop).toBe(true);
      expect(mockGainNode.gain.value).toBe(0.5);
    });

    it('clamps volume to valid range', () => {
      const mockGainNode = {
        gain: { value: 1 },
        connect: jest.fn()
      };

      const mockContext = {
        createBufferSource: jest.fn(() => ({
          buffer: null,
          loop: false,
          connect: jest.fn(),
          start: jest.fn()
        })),
        createGain: jest.fn(() => mockGainNode),
        destination: {}
      };

      const mockBuffer = { length: 1024 };
      
      playAudioBuffer(mockContext, mockBuffer, 2.0);
      expect(mockGainNode.gain.value).toBe(1);
      
      playAudioBuffer(mockContext, mockBuffer, -0.5);
      expect(mockGainNode.gain.value).toBe(0);
    });

    it('returns null for invalid inputs', () => {
      expect(playAudioBuffer(null, {})).toBeNull();
      expect(playAudioBuffer({}, null)).toBeNull();
    });
  });

  describe('stopAudioSource', () => {
    it('stops audio source', () => {
      const mockSource = {
        stop: jest.fn()
      };
      
      stopAudioSource(mockSource);
      expect(mockSource.stop).toHaveBeenCalled();
    });

    it('handles already stopped sources', () => {
      const mockSource = {
        stop: jest.fn(() => {
          throw new Error('Source already stopped');
        })
      };
      
      expect(() => stopAudioSource(mockSource)).not.toThrow();
    });

    it('handles null source', () => {
      expect(() => stopAudioSource(null)).not.toThrow();
    });
  });

  describe('fadeAudio', () => {
    it('fades audio to target volume', () => {
      const mockGainNode = {
        gain: {
          value: 1,
          cancelScheduledValues: jest.fn(),
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn()
        },
        context: {
          currentTime: 5
        }
      };
      
      fadeAudio(mockGainNode, 0.5, 2000);
      
      expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(5);
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, 5);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 7);
    });

    it('uses default duration', () => {
      const mockGainNode = {
        gain: {
          value: 0.8,
          cancelScheduledValues: jest.fn(),
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn()
        },
        context: {
          currentTime: 10
        }
      };
      
      fadeAudio(mockGainNode, 0);
      
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 11);
    });

    it('handles null gain node', () => {
      expect(() => fadeAudio(null, 0.5)).not.toThrow();
    });
  });
});