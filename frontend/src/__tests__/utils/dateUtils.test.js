// Simple date utility functions for testing
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

describe('Date Utilities', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('returns empty string for null date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('checks if date is today', () => {
    const today = new Date();
    expect(isToday(today)).toBe(true);
    expect(isToday(null)).toBe(false);
  });

  it('adds days to date', () => {
    const date = new Date(2024, 0, 15); // Use constructor to avoid timezone issues
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
  });
});