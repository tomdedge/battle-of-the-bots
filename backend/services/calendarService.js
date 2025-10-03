const { google } = require('googleapis');
const dbService = require('./dbService');

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  suggestFocusBlock(gap, taskContext = '') {
    return {
      title: `Focus Block - ${Math.floor(gap.duration)} min`,
      start: { dateTime: gap.start.toISOString() },
      end: { dateTime: gap.end.toISOString() },
      description: `Suggested focus time${taskContext ? `. Context: ${taskContext}` : ''}`,
      colorId: '2'
    };
  }

  async getAuthenticatedClient(userId) {
    const user = await dbService.getUserById(userId);
    console.log('User data for calendar auth:', {
      userId,
      hasUser: !!user,
      hasAccessToken: !!(user?.access_token),
      hasRefreshToken: !!(user?.refresh_token),
      accessTokenLength: user?.access_token?.length || 0
    });
    
    if (!user || !user.access_token) {
      throw new Error('User not authenticated');
    }
    
    this.oauth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token
    });

    // Try to refresh the token if it's expired
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      if (credentials.access_token !== user.access_token) {
        // Update the database with new tokens
        await dbService.updateUserTokens(userId, {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || user.refresh_token
        });
        console.log('Refreshed access token for user:', userId);
      }
    } catch (refreshError) {
      console.log('Token refresh failed (may not be expired):', refreshError.message);
    }
    
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async getEvents(userId, timeMin, timeMax) {
    const calendar = await this.getAuthenticatedClient(userId);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return response.data.items || [];
  }

  async createEvent(userId, eventData) {
    const calendar = await this.getAuthenticatedClient(userId);
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: eventData
    });
    return response.data;
  }

  async analyzeCalendarGaps(userId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    const events = await this.getEvents(userId, startOfDay.toISOString(), endOfDay.toISOString());
    const gaps = this.findTimeGaps(events, startOfDay, endOfDay);
    return gaps.filter(gap => gap.duration >= 25);
  }

  findTimeGaps(events, startTime, endTime) {
    const gaps = [];
    let currentTime = new Date(startTime);

    const sortedEvents = events.sort((a, b) => 
      new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date)
    );

    for (const event of sortedEvents) {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      
      if (currentTime < eventStart) {
        const gapDuration = (eventStart - currentTime) / (1000 * 60);
        if (gapDuration >= 25) {
          gaps.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: gapDuration
          });
        }
      }
      
      currentTime = new Date(event.end.dateTime || event.end.date);
    }

    if (currentTime < endTime) {
      const finalGapDuration = (endTime - currentTime) / (1000 * 60);
      if (finalGapDuration >= 25) {
        gaps.push({
          start: new Date(currentTime),
          end: new Date(endTime),
          duration: finalGapDuration
        });
      }
    }

    return gaps;
  }

  async updateEvent(userId, eventId, updateData) {
    try {
      const calendar = await this.getAuthenticatedClient(userId);
      const eventData = {};
      
      if (updateData.title) eventData.summary = updateData.title;
      if (updateData.description) eventData.description = updateData.description;
      if (updateData.location) eventData.location = updateData.location;
      if (updateData.startDateTime) eventData.start = { dateTime: updateData.startDateTime };
      if (updateData.endDateTime) eventData.end = { dateTime: updateData.endDateTime };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: eventData
      });
      
      return response.data;
    } catch (error) {
      if (error.code === 404 || error.message.includes('Not Found')) {
        throw new Error(`Calendar event with ID "${eventId}" not found. To update an event, you must first call calendar_get_events to get the current list of events and their valid IDs, then use the exact event ID from that response.`);
      }
      throw error;
    }
  }

  async deleteEvent(userId, eventId) {
    try {
      const calendar = await this.getAuthenticatedClient(userId);
      await calendar.events.delete({
        calendarId: 'primary',
        eventId
      });
      
      return { success: true, eventId };
    } catch (error) {
      if (error.code === 404 || error.message.includes('Not Found')) {
        throw new Error(`Calendar event with ID "${eventId}" not found. To delete an event, you must first call calendar_get_events to get the current list of events and their valid IDs, then use the exact event ID from that response.`);
      }
      throw error;
    }
  }
}

module.exports = new CalendarService();