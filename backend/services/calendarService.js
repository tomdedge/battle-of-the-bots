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
    // Cap duration at 120 minutes (2 hours) for reasonable focus sessions
    const duration = Math.min(Math.floor(gap.duration), 120);
    let title = `Focus Block`;
    
    // Add duration-based context
    if (duration >= 90) {
      title = `Deep Focus Session`;
    } else if (duration >= 60) {
      title = `Focus Block`;
    } else if (duration >= 45) {
      title = `Focus Block`;
    } else if (duration >= 25) {
      title = `Pomodoro Session`;
    } else {
      title = `Quick Focus`;
    }
    
    return {
      title: `${title} (${duration} min)`,
      start: { dateTime: gap.start.toISOString() },
      end: { dateTime: new Date(gap.start.getTime() + duration * 60 * 1000).toISOString() },
      description: `AI-suggested focus time${taskContext ? `. Context: ${taskContext}` : ''}. Duration: ${duration} minutes.`,
      colorId: '2',
      duration: duration // Explicitly include duration for frontend
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
    const now = new Date();
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    
    // Expand time window: 7 AM - 9 PM
    startOfDay.setHours(7, 0, 0, 0);
    endOfDay.setHours(21, 0, 0, 0);
    
    // If analyzing today, start from current time if it's later than 7 AM
    if (date.toDateString() === now.toDateString() && now > startOfDay) {
      startOfDay.setTime(now.getTime());
    }

    console.log('Analyzing calendar gaps:', {
      userId,
      date: date.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      isToday: date.toDateString() === now.toDateString()
    });

    const events = await this.getEvents(userId, startOfDay.toISOString(), endOfDay.toISOString());
    console.log(`Found ${events.length} events for gap analysis`);
    
    const gaps = this.findTimeGaps(events, startOfDay, endOfDay);
    console.log(`Found ${gaps.length} potential gaps`);
    
    // Reduce minimum duration to 15 minutes for more suggestions
    const filteredGaps = gaps.filter(gap => gap.duration >= 15);
    console.log(`${filteredGaps.length} gaps meet minimum duration (15 min)`);
    
    return filteredGaps;
  }

  findTimeGaps(events, startTime, endTime) {
    const gaps = [];
    let currentTime = new Date(startTime);

    // Filter out all-day events and sort by start time
    const timedEvents = events.filter(event => 
      event.start.dateTime && event.end.dateTime
    );
    
    const sortedEvents = timedEvents.sort((a, b) => 
      new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );

    console.log(`Processing ${sortedEvents.length} timed events for gaps`);

    for (const event of sortedEvents) {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Skip events that have already ended
      if (eventEnd <= currentTime) {
        continue;
      }
      
      // If event starts after current time, there's a gap
      if (currentTime < eventStart) {
        const gapDuration = (eventStart - currentTime) / (1000 * 60);
        console.log(`Found gap: ${currentTime.toISOString()} to ${eventStart.toISOString()} (${gapDuration} min)`);
        
        if (gapDuration >= 15) {
          gaps.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: gapDuration
          });
        }
      }
      
      // Move current time to end of this event (or keep it if event ends before current time)
      currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
    }

    // Check for final gap until end of day
    if (currentTime < endTime) {
      const finalGapDuration = (endTime - currentTime) / (1000 * 60);
      console.log(`Found final gap: ${currentTime.toISOString()} to ${endTime.toISOString()} (${finalGapDuration} min)`);
      
      if (finalGapDuration >= 15) {
        gaps.push({
          start: new Date(currentTime),
          end: new Date(endTime),
          duration: finalGapDuration
        });
      }
    }

    console.log(`Total gaps found: ${gaps.length}`);
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