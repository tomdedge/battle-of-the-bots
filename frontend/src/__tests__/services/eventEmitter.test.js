// Simple EventEmitter for testing
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return this;
    
    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
    
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
    
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
    
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    
    this.on(event, onceWrapper);
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  eventNames() {
    return Object.keys(this.events);
  }
}

describe('EventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on/emit', () => {
    it('registers and calls event listeners', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      
      emitter.emit('test', 'arg1', 'arg2');
      
      expect(listener).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('calls multiple listeners for the same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit('test', 'data');
      
      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('returns false when emitting non-existent event', () => {
      const result = emitter.emit('nonexistent');
      expect(result).toBe(false);
    });

    it('returns true when emitting existing event', () => {
      emitter.on('test', () => {});
      const result = emitter.emit('test');
      expect(result).toBe(true);
    });

    it('handles errors in listeners gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      emitter.on('test', badListener);
      emitter.on('test', goodListener);
      
      emitter.emit('test');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in event listener:', expect.any(Error));
      expect(goodListener).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('off', () => {
    it('removes specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.off('test', listener1);
      
      emitter.emit('test');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('removes event when no listeners remain', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.off('test', listener);
      
      expect(emitter.eventNames()).not.toContain('test');
    });

    it('handles removing non-existent listener', () => {
      const listener = jest.fn();
      expect(() => emitter.off('test', listener)).not.toThrow();
    });
  });

  describe('once', () => {
    it('calls listener only once', () => {
      const listener = jest.fn();
      emitter.once('test', listener);
      
      emitter.emit('test', 'first');
      emitter.emit('test', 'second');
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('first');
    });

    it('removes listener after first call', () => {
      const listener = jest.fn();
      emitter.once('test', listener);
      
      expect(emitter.listenerCount('test')).toBe(1);
      emitter.emit('test');
      expect(emitter.listenerCount('test')).toBe(0);
    });
  });

  describe('removeAllListeners', () => {
    it('removes all listeners for specific event', () => {
      emitter.on('test1', () => {});
      emitter.on('test1', () => {});
      emitter.on('test2', () => {});
      
      emitter.removeAllListeners('test1');
      
      expect(emitter.listenerCount('test1')).toBe(0);
      expect(emitter.listenerCount('test2')).toBe(1);
    });

    it('removes all listeners for all events', () => {
      emitter.on('test1', () => {});
      emitter.on('test2', () => {});
      
      emitter.removeAllListeners();
      
      expect(emitter.eventNames()).toHaveLength(0);
    });
  });

  describe('listenerCount', () => {
    it('returns correct listener count', () => {
      expect(emitter.listenerCount('test')).toBe(0);
      
      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(1);
      
      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('eventNames', () => {
    it('returns array of event names', () => {
      expect(emitter.eventNames()).toEqual([]);
      
      emitter.on('test1', () => {});
      emitter.on('test2', () => {});
      
      expect(emitter.eventNames()).toEqual(['test1', 'test2']);
    });
  });

  describe('method chaining', () => {
    it('supports method chaining', () => {
      const listener = jest.fn();
      
      const result = emitter
        .on('test1', listener)
        .on('test2', listener)
        .off('test1', listener)
        .once('test3', listener)
        .removeAllListeners('test2');
      
      expect(result).toBe(emitter);
    });
  });
});