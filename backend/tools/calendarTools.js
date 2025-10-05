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
            summary: { type: 'string', description: 'Event title/summary' },
            description: { type: 'string', description: 'Event description' },
            start: { 
              type: 'object',
              properties: {
                dateTime: { type: 'string', description: 'Start date/time (ISO format)' }
              },
              required: ['dateTime']
            },
            end: { 
              type: 'object',
              properties: {
                dateTime: { type: 'string', description: 'End date/time (ISO format)' }
              },
              required: ['dateTime']
            },
            location: { type: 'string', description: 'Event location' },
            attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee emails' }
          },
          required: ['userId', 'summary', 'start', 'end']
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
        description: 'Delete a calendar event by ID or by name/title. Provide either eventId OR eventName.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            eventId: { type: 'string', description: 'Event ID (if known)' },
            eventName: { type: 'string', description: 'Event name/title to search for and delete' },
            startDate: { type: 'string', description: 'Start date to search within (ISO format, optional)' },
            endDate: { type: 'string', description: 'End date to search within (ISO format, optional)' }
          },
          required: ['userId']
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
    const { userId, summary, description, start, end, location, attendees } = args;
    
    const eventData = {
      summary,
      description,
      location,
      start: { dateTime: start.dateTime },
      end: { dateTime: end.dateTime },
      attendees: attendees?.map(email => ({ email }))
    };

    return await calendarService.createEvent(userId, eventData);
  }

  static async getEvents(args) {
    const { userId, startDate, endDate } = args;
    
    // Normalize date formats - convert date-only strings to full ISO datetime
    let normalizedStartDate = startDate;
    let normalizedEndDate = endDate;
    
    if (startDate && !startDate.includes('T')) {
      // Convert YYYY-MM-DD to start of day ISO datetime
      normalizedStartDate = new Date(startDate + 'T00:00:00').toISOString();
    }
    
    if (endDate && !endDate.includes('T')) {
      // Convert YYYY-MM-DD to end of day ISO datetime
      normalizedEndDate = new Date(endDate + 'T23:59:59').toISOString();
    }
    
    return await calendarService.getEvents(userId, normalizedStartDate, normalizedEndDate);
  }

  static async updateEvent(args) {
    const { userId, eventId, ...updateData } = args;
    return await calendarService.updateEvent(userId, eventId, updateData);
  }

  static async deleteEvent(args) {
    const { userId, eventId, eventName, startDate, endDate } = args;
    
    if (!eventId && !eventName) {
      throw new Error('Either eventId or eventName must be provided');
    }
    
    if (eventName) {
      // Convert date strings to ISO format if needed
      let searchStartDate = startDate;
      let searchEndDate = endDate;
      
      if (startDate && !startDate.includes('T')) {
        // Convert YYYY-MM-DD to full ISO datetime
        searchStartDate = new Date(startDate + 'T00:00:00').toISOString();
      }
      
      if (endDate && !endDate.includes('T')) {
        // Convert YYYY-MM-DD to full ISO datetime (end of day)
        searchEndDate = new Date(endDate + 'T23:59:59').toISOString();
      }
      
      // Find event by name first
      const events = await calendarService.getEvents(userId, searchStartDate, searchEndDate);
      const matchingEvent = events.find(event => 
        event.summary && event.summary.toLowerCase().includes(eventName.toLowerCase())
      );
      
      if (!matchingEvent) {
        throw new Error(`No event found with name containing "${eventName}"`);
      }
      
      return await calendarService.deleteEvent(userId, matchingEvent.id);
    } else {
      return await calendarService.deleteEvent(userId, eventId);
    }
  }
}

module.exports = CalendarTools;