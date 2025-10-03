// Formatter utility functions for testing
export const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || seconds < 0) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDuration = (minutes) => {
  if (typeof minutes !== 'number' || minutes <= 0) return '0 minutes';
  
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

export const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const formatPercentage = (value, total) => {
  if (typeof value !== 'number' || typeof total !== 'number' || total === 0) {
    return '0%';
  }
  
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
};

export const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
};

describe('Formatter Utilities', () => {
  describe('formatTime', () => {
    it('formats seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('handles invalid input', () => {
      expect(formatTime(-1)).toBe('00:00');
      expect(formatTime('invalid')).toBe('00:00');
      expect(formatTime(null)).toBe('00:00');
      expect(formatTime(undefined)).toBe('00:00');
    });
  });

  describe('formatDuration', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration(0)).toBe('0 minutes');
      expect(formatDuration(1)).toBe('1 minute');
      expect(formatDuration(30)).toBe('30 minutes');
      expect(formatDuration(60)).toBe('1 hour');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2 hours');
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('handles invalid input', () => {
      expect(formatDuration(-1)).toBe('0 minutes');
      expect(formatDuration('invalid')).toBe('0 minutes');
      expect(formatDuration(null)).toBe('0 minutes');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('handles invalid input', () => {
      expect(formatFileSize(-1)).toBe('0 B');
      expect(formatFileSize('invalid')).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
    });
  });

  describe('formatPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(formatPercentage(0, 100)).toBe('0%');
      expect(formatPercentage(25, 100)).toBe('25%');
      expect(formatPercentage(50, 100)).toBe('50%');
      expect(formatPercentage(75, 100)).toBe('75%');
      expect(formatPercentage(100, 100)).toBe('100%');
      expect(formatPercentage(33, 100)).toBe('33%');
    });

    it('handles edge cases', () => {
      expect(formatPercentage(10, 0)).toBe('0%');
      expect(formatPercentage('invalid', 100)).toBe('0%');
      expect(formatPercentage(50, 'invalid')).toBe('0%');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
      expect(truncateText(longText, 10)).toBe('This is...');
    });

    it('keeps short text unchanged', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
      expect(truncateText(shortText)).toBe('Short text');
    });

    it('handles invalid input', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123)).toBe('');
    });
  });
});