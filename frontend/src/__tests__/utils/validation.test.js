// Simple validation functions for testing
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password) return false;
  return password.length >= 8;
};

export const validateTaskTitle = (title) => {
  if (!title) return false;
  return title.trim().length > 0 && title.length <= 100;
};

export const sanitizeInput = (input) => {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
};

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
    });

    it('rejects weak password', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe('validateTaskTitle', () => {
    it('validates good task title', () => {
      expect(validateTaskTitle('Valid task')).toBe(true);
      expect(validateTaskTitle('A')).toBe(true);
    });

    it('rejects invalid task title', () => {
      expect(validateTaskTitle('')).toBe(false);
      expect(validateTaskTitle('   ')).toBe(false);
      expect(validateTaskTitle(null)).toBe(false);
      expect(validateTaskTitle('a'.repeat(101))).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes input correctly', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
    });
  });
});