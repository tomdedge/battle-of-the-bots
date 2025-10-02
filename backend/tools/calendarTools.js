const calendarService = require('../services/calendarService');

class CalendarTools {
  static getToolDefinitions() {
    return [
      {
        name: 'calendar_create_event',
        description: 'Create a new calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            startDateTime: { type: 'string', description: 'Start date/time (ISO format)' },
            endDateTime: { type: 'string', description: 'End date/time (ISO format)' },
            location: { type: 'string', description: 'Event location' },
            attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee emails' }
          },
          required: ['userId', 'title', 'startDateTime', 'endDateTime']
        }
      },
      {
        name: 'calendar_get_events',
        description: 'Get calendar events within a date range',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            startDate: { type: 'string', description: 'Start date (ISO format)' },
            endDate: { type: 'string', description: 'End date (ISO format)' }
          },
          required: ['userId']
        }
      },
      {
        name: 'calendar_update_event',
        description: 'Update an existing calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            eventId: { type: 'string', description: 'Event ID' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            startDateTime: { type: 'string', description: 'Start date/time (ISO format)' },
            endDateTime: { type: 'string', description: 'End date/time (ISO format)' },
            location: { type: 'string', description: 'Event location' }
          },
          required: ['userId', 'eventId']
        }
      },
      {
        name: 'calendar_delete_event',
        description: 'Delete a calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            eventId: { type: 'string', description: 'Event ID' }
          },
          required: ['userId', 'eventId']
        }
      }
    ];
  }

  static async executeTool(toolName, args) {
    switch (toolName) {
      case 'calendar_create_event':
        return await this.createEvent(args);
      case 'calendar_get_events':
        return await this.getEvents(args);
      case 'calendar_update_event':
        return await this.updateEvent(args);
      case 'calendar_delete_event':
        return await this.deleteEvent(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  static async createEvent(args) {
    const { userId, title, description, startDateTime, endDateTime, location, attendees } = args;
    
    const eventData = {
      summary: title,
      description,
      location,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: attendees?.map(email => ({ email }))
    };

    return await calendarService.createEvent(userId, eventData);
  }

  static async getEvents(args) {
    const { userId, startDate, endDate } = args;
    return await calendarService.getEvents(userId, startDate, endDate);
  }

  static async updateEvent(args) {
    const { userId, eventId, ...updateData } = args;
    return await calendarService.updateEvent(userId, eventId, updateData);
  }

  static async deleteEvent(args) {
    const { userId, eventId } = args;
    return await calendarService.deleteEvent(userId, eventId);
  }
}

module.exports = CalendarTools;