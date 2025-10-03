const calendarService = require('../services/calendarService');

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn()
      }))
    },
    calendar: jest.fn(() => ({
      events: {
        list: jest.fn(),
        insert: jest.fn()
      }
    }))
  }
}));

// Mock dbService
jest.mock('../services/dbService', () => ({
  getUserById: jest.fn(),
  updateUserTokens: jest.fn()
}));

const { google } = require('googleapis');
const dbService = require('../services/dbService');

describe('CalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthenticatedClient', () => {
    it('should return authenticated calendar client', async () => {
      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockCalendar = { events: { list: jest.fn() } };
      google.calendar.mockReturnValueOnce(mockCalendar);

      const result = await calendarService.getAuthenticatedClient(1);

      expect(dbService.getUserById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockCalendar);
    });

    it('should throw error if user not authenticated', async () => {
      dbService.getUserById.mockResolvedValueOnce(null);

      await expect(calendarService.getAuthenticatedClient(1))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw error if user has no access token', async () => {
      const mockUser = {
        id: 1,
        access_token: null,
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      await expect(calendarService.getAuthenticatedClient(1))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('getEvents', () => {
    it('should return calendar events', async () => {
      const mockEvents = [
        {
          id: '1',
          summary: 'Test Event',
          start: { dateTime: '2023-10-01T10:00:00Z' },
          end: { dateTime: '2023-10-01T11:00:00Z' }
        }
      ];

      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockCalendar = {
        events: {
          list: jest.fn().mockResolvedValueOnce({
            data: { items: mockEvents }
          })
        }
      };

      google.calendar.mockReturnValueOnce(mockCalendar);

      const result = await calendarService.getEvents(1, '2023-10-01T00:00:00Z', '2023-10-01T23:59:59Z');

      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: '2023-10-01T00:00:00Z',
        timeMax: '2023-10-01T23:59:59Z',
        singleEvents: true,
        orderBy: 'startTime'
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findTimeGaps', () => {
    it('should find gaps between events', () => {
      const events = [
        {
          start: { dateTime: '2023-10-01T10:00:00Z' },
          end: { dateTime: '2023-10-01T11:00:00Z' }
        },
        {
          start: { dateTime: '2023-10-01T14:00:00Z' },
          end: { dateTime: '2023-10-01T15:00:00Z' }
        }
      ];

      const startTime = new Date('2023-10-01T08:00:00Z');
      const endTime = new Date('2023-10-01T18:00:00Z');

      const gaps = calendarService.findTimeGaps(events, startTime, endTime);

      expect(gaps).toHaveLength(3); // Before first event, between events, after last event
      expect(gaps[0].duration).toBeGreaterThan(25); // Should be longer than 25 minutes
    });

    it('should return empty array if no gaps', () => {
      const events = [
        {
          start: { dateTime: '2023-10-01T08:00:00Z' },
          end: { dateTime: '2023-10-01T18:00:00Z' }
        }
      ];

      const startTime = new Date('2023-10-01T08:00:00Z');
      const endTime = new Date('2023-10-01T18:00:00Z');

      const gaps = calendarService.findTimeGaps(events, startTime, endTime);

      expect(gaps).toHaveLength(0);
    });
  });

  describe('suggestFocusBlock', () => {
    it('should create focus block suggestion', () => {
      const gap = {
        start: new Date('2023-10-01T14:00:00Z'),
        end: new Date('2023-10-01T15:00:00Z'),
        duration: 60
      };

      const suggestion = calendarService.suggestFocusBlock(gap);

      expect(suggestion).toEqual({
        title: 'Focus Block (60 min)',
        start: { dateTime: gap.start.toISOString() },
        end: { dateTime: new Date(gap.start.getTime() + 60 * 60 * 1000).toISOString() },
        description: 'AI-suggested focus time. Duration: 60 minutes.',
        colorId: '2',
        duration: 60
      });
    });

    it('should include task context in description', () => {
      const gap = {
        start: new Date('2023-10-01T14:00:00Z'),
        end: new Date('2023-10-01T15:00:00Z'),
        duration: 30
      };

      const suggestion = calendarService.suggestFocusBlock(gap, 'Review documents');

      expect(suggestion.description).toBe('AI-suggested focus time. Context: Review documents. Duration: 30 minutes.');
    });
  });
});
