// Constants for testing
export const APP_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_TASK_TITLE_LENGTH: 100,
  DEFAULT_FOCUS_DURATION: 25,
  BREATHING_PHASES: ['inhale', 'hold', 'exhale', 'hold'],
  SOUNDSCAPES: ['forest', 'cabin', 'beach', 'whitenoise'],
  API_ENDPOINTS: {
    TASKS: '/api/tasks',
    CALENDAR: '/api/calendar',
    CHAT: '/api/chat'
  }
};

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  TASK_TITLE_MAX_LENGTH: 100
};

export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500
};

describe('Constants', () => {
  describe('APP_CONSTANTS', () => {
    it('has correct message length limit', () => {
      expect(APP_CONSTANTS.MAX_MESSAGE_LENGTH).toBe(1000);
    });

    it('has correct task title length limit', () => {
      expect(APP_CONSTANTS.MAX_TASK_TITLE_LENGTH).toBe(100);
    });

    it('has correct default focus duration', () => {
      expect(APP_CONSTANTS.DEFAULT_FOCUS_DURATION).toBe(25);
    });

    it('has correct breathing phases', () => {
      expect(APP_CONSTANTS.BREATHING_PHASES).toHaveLength(4);
      expect(APP_CONSTANTS.BREATHING_PHASES).toContain('inhale');
      expect(APP_CONSTANTS.BREATHING_PHASES).toContain('exhale');
    });

    it('has correct soundscapes', () => {
      expect(APP_CONSTANTS.SOUNDSCAPES).toHaveLength(4);
      expect(APP_CONSTANTS.SOUNDSCAPES).toContain('forest');
      expect(APP_CONSTANTS.SOUNDSCAPES).toContain('beach');
    });

    it('has correct API endpoints', () => {
      expect(APP_CONSTANTS.API_ENDPOINTS.TASKS).toBe('/api/tasks');
      expect(APP_CONSTANTS.API_ENDPOINTS.CALENDAR).toBe('/api/calendar');
      expect(APP_CONSTANTS.API_ENDPOINTS.CHAT).toBe('/api/chat');
    });
  });

  describe('VALIDATION_RULES', () => {
    it('has correct email regex', () => {
      expect(VALIDATION_RULES.EMAIL_REGEX.test('test@example.com')).toBe(true);
      expect(VALIDATION_RULES.EMAIL_REGEX.test('invalid-email')).toBe(false);
    });

    it('has correct password minimum length', () => {
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(8);
    });

    it('has correct task title maximum length', () => {
      expect(VALIDATION_RULES.TASK_TITLE_MAX_LENGTH).toBe(100);
    });
  });

  describe('UI_CONSTANTS', () => {
    it('has correct breakpoints', () => {
      expect(UI_CONSTANTS.MOBILE_BREAKPOINT).toBe(768);
      expect(UI_CONSTANTS.TABLET_BREAKPOINT).toBe(1024);
    });

    it('has correct timing constants', () => {
      expect(UI_CONSTANTS.ANIMATION_DURATION).toBe(300);
      expect(UI_CONSTANTS.DEBOUNCE_DELAY).toBe(500);
    });
  });
});