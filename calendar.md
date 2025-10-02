# AuraFlow Calendar Implementation Plan

## Overview
Implement the calendar features for AuraFlow's mindful productivity system, building on the existing authenticated chat infrastructure. Focus on AI-powered focus block suggestions and seamless calendar management.

## Current State Analysis
**✅ Already Implemented:**
- Express + Socket.io server with authentication
- React frontend with Mantine UI and custom theme
- Google OAuth integration with database persistence
- AI chat service with LiteLLM integration
- User context and chat history persistence
- Playwright E2E testing framework

**🎯 Calendar Features to Implement:**
- Google Calendar API integration
- Calendar view components (Day/Week/Month)
- AI-powered focus block suggestions
- Calendar analysis and gap detection
- Event creation and management

## Implementation Strategy

### Phase 1: Backend Calendar Infrastructure (Week 1)

#### 1.1 Google Calendar Service Enhancement
```javascript
// backend/services/calendarService.js - Enhanced version
class CalendarService {
  // ... existing auth methods ...

  async analyzeCalendarGaps(userId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0); // 8 AM start
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // 6 PM end

    const events = await this.getEvents(userId, startOfDay.toISOString(), endOfDay.toISOString());
    
    // Find gaps of 25+ minutes
    const gaps = this.findTimeGaps(events, startOfDay, endOfDay);
    return gaps.filter(gap => gap.duration >= 25); // Minimum focus block time
  }

  findTimeGaps(events, startTime, endTime) {
    const gaps = [];
    let currentTime = new Date(startTime);

    // Sort events by start time
    const sortedEvents = events.sort((a, b) => 
      new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date)
    );

    for (const event of sortedEvents) {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      
      if (currentTime < eventStart) {
        const gapDuration = (eventStart - currentTime) / (1000 * 60); // minutes
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

    // Check for gap after last event
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

  async suggestFocusBlock(userId, gap, taskContext = '') {
    // AI-powered focus block suggestion
    const suggestion = {
      title: `Focus Block - ${Math.floor(gap.duration)} min`,
      start: gap.start.toISOString(),
      end: gap.end.toISOString(),
      description: `Suggested focus time based on calendar analysis${taskContext ? `. Context: ${taskContext}` : ''}`,
      colorId: '2', // Green for focus blocks
      transparency: 'transparent' // Show as available time
    };

    return suggestion;
  }
}
```

#### 1.2 AI Service Calendar Tools
```javascript
// backend/services/aiService.js - Add calendar tools
const calendarTools = [
  {
    type: "function",
    function: {
      name: "analyze_calendar",
      description: "Analyze user's calendar for available focus time slots",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date to analyze (YYYY-MM-DD)" },
          minDuration: { type: "number", description: "Minimum duration in minutes", default: 25 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_focus_block",
      description: "Suggest a focus block for user approval",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Focus block title" },
          duration: { type: "number", description: "Duration in minutes" },
          context: { type: "string", description: "What to focus on" }
        }
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event after user approval",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start: { type: "string", description: "Start time (ISO string)" },
          end: { type: "string", description: "End time (ISO string)" },
          description: { type: "string", description: "Event description" }
        }
      }
    }
  }
];

// Enhanced sendMessage with calendar tools
async sendMessage(message, model = 'gpt-4o-mini', userId = null, sessionId = null) {
  const systemContent = userId 
    ? `You are AuraFlow, a mindful productivity assistant. You can analyze calendars and suggest focus blocks. Always ask for user approval before creating calendar events. Keep responses concise and helpful.`
    : 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.';

  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: message }
    ]
  };

  // Add tools if user is authenticated
  if (userId) {
    requestBody.tools = calendarTools;
    requestBody.tool_choice = "auto";
  }

  // ... rest of implementation
}
```

#### 1.3 Calendar Routes
```javascript
// backend/routes/calendar.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { CalendarService } = require('../services/calendarService');

const router = express.Router();
const calendarService = new CalendarService();

router.use(authenticateToken);

// Get calendar events
router.get('/events', async (req, res) => {
  try {
    const { start, end, view = 'month' } = req.query;
    const events = await calendarService.getEvents(req.user.userId, start, end);
    res.json({ events, view });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze calendar for focus opportunities
router.get('/analyze', async (req, res) => {
  try {
    const { date } = req.query;
    const gaps = await calendarService.analyzeCalendarGaps(req.user.userId, date ? new Date(date) : new Date());
    const suggestions = gaps.map(gap => calendarService.suggestFocusBlock(req.user.userId, gap));
    res.json({ gaps, suggestions: await Promise.all(suggestions) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create focus block (after user approval)
router.post('/focus-block', async (req, res) => {
  try {
    const event = await calendarService.createEvent(req.user.userId, req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Phase 2: Frontend Calendar Components (Week 2)

#### 2.1 Calendar View Component
```javascript
// frontend/src/components/Calendar/CalendarView.jsx
import { useState, useEffect } from 'react';
import { Stack, SegmentedControl, Paper, LoadingOverlay } from '@mantine/core';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useApi } from '../../services/api';
import { FocusBlockSuggestion } from './FocusBlockSuggestion';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css'; // Custom Mantine-themed styles

const localizer = momentLocalizer(moment);

export const CalendarView = () => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    loadCalendarData();
  }, [date, view]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on view
      const { start, end } = getDateRange(date, view);
      
      // Load events and suggestions
      const [eventsResponse, analysisResponse] = await Promise.all([
        api.getCalendarEvents(start.toISOString(), end.toISOString()),
        api.analyzeCalendar(date.toISOString().split('T')[0])
      ]);

      setEvents(eventsResponse.events || []);
      setSuggestions(analysisResponse.suggestions || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (currentDate, currentView) => {
    const start = moment(currentDate).startOf(currentView === 'month' ? 'month' : 'week');
    const end = moment(currentDate).endOf(currentView === 'month' ? 'month' : 'week');
    return { start: start.toDate(), end: end.toDate() };
  };

  const handleSuggestionApprove = async (suggestion) => {
    try {
      await api.createFocusBlock(suggestion);
      await loadCalendarData(); // Refresh calendar
      setSuggestions(prev => prev.filter(s => s !== suggestion));
    } catch (error) {
      console.error('Failed to create focus block:', error);
    }
  };

  const handleSuggestionDismiss = (suggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  return (
    <Stack h="100%" gap="md">
      <Paper p="sm">
        <SegmentedControl
          value={view}
          onChange={setView}
          data={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' }
          ]}
          fullWidth
        />
      </Paper>

      <Paper flex={1} pos="relative">
        <LoadingOverlay visible={loading} />
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          style={{ height: '100%' }}
          className="aura-calendar"
        />

        {/* Focus block suggestions overlay */}
        {suggestions.map((suggestion, index) => (
          <FocusBlockSuggestion
            key={index}
            suggestion={suggestion}
            view={view}
            onApprove={() => handleSuggestionApprove(suggestion)}
            onDismiss={() => handleSuggestionDismiss(suggestion)}
          />
        ))}
      </Paper>
    </Stack>
  );
};
```

#### 2.2 Focus Block Suggestion Component
```javascript
// frontend/src/components/Calendar/FocusBlockSuggestion.jsx
import { Card, Text, Group, Button, Badge, Stack } from '@mantine/core';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';
import moment from 'moment';

export const FocusBlockSuggestion = ({ suggestion, view, onApprove, onDismiss }) => {
  const formatTime = (dateString) => {
    return moment(dateString).format('h:mm A');
  };

  const getDuration = () => {
    const start = moment(suggestion.start);
    const end = moment(suggestion.end);
    return end.diff(start, 'minutes');
  };

  // Position suggestion based on calendar view
  const getPositionStyle = () => {
    if (view === 'day') {
      // Full card overlay for day view
      return {
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '300px'
      };
    } else if (view === 'week') {
      // Compact suggestion for week view
      return {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        maxWidth: '250px'
      };
    } else {
      // Small badge for month view
      return {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        maxWidth: '200px'
      };
    }
  };

  if (view === 'month') {
    // Minimal suggestion for month view
    return (
      <Card style={getPositionStyle()} p="xs" shadow="md">
        <Group gap="xs">
          <Badge color="aura.1" size="sm">
            Focus {getDuration()}m
          </Badge>
          <Button size="xs" variant="light" onClick={onApprove}>
            <IconCheck size={12} />
          </Button>
          <Button size="xs" variant="light" color="gray" onClick={onDismiss}>
            <IconX size={12} />
          </Button>
        </Group>
      </Card>
    );
  }

  return (
    <Card style={getPositionStyle()} p="md" shadow="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500} size="sm">Focus Block Available</Text>
          <Badge color="aura.1" leftSection={<IconClock size={12} />}>
            {getDuration()} min
          </Badge>
        </Group>
        
        <Text size="sm" c="dimmed">
          {formatTime(suggestion.start)} - {formatTime(suggestion.end)}
        </Text>
        
        {suggestion.description && (
          <Text size="xs" c="dimmed">
            {suggestion.description}
          </Text>
        )}
        
        <Group gap="xs" justify="flex-end">
          <Button 
            size="xs" 
            variant="light" 
            color="gray" 
            onClick={onDismiss}
            leftSection={<IconX size={12} />}
          >
            Dismiss
          </Button>
          <Button 
            size="xs" 
            onClick={onApprove}
            leftSection={<IconCheck size={12} />}
          >
            Add to Calendar
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};
```

#### 2.3 API Service Extensions
```javascript
// frontend/src/services/api.js - Add calendar methods
class ApiService {
  // ... existing methods ...

  // Calendar methods
  async getCalendarEvents(start, end) {
    return this.request(`/api/calendar/events?start=${start}&end=${end}`);
  }

  async analyzeCalendar(date) {
    return this.request(`/api/calendar/analyze?date=${date}`);
  }

  async createFocusBlock(focusBlockData) {
    return this.request('/api/calendar/focus-block', {
      method: 'POST',
      body: JSON.stringify(focusBlockData),
    });
  }

  async createCalendarEvent(eventData) {
    return this.request('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }
}
```

### Phase 3: AI Integration & Chat Enhancement (Week 3)

#### 3.1 Enhanced Chat Interface for Calendar
```javascript
// frontend/src/components/Chat/ChatInterface.jsx - Add calendar context
export const ChatInterface = () => {
  // ... existing state ...
  const [calendarContext, setCalendarContext] = useState(null);

  // Load calendar context when component mounts
  useEffect(() => {
    loadCalendarContext();
  }, []);

  const loadCalendarContext = async () => {
    try {
      const api = useApi();
      const today = new Date().toISOString().split('T')[0];
      const analysis = await api.analyzeCalendar(today);
      setCalendarContext(analysis);
    } catch (error) {
      console.error('Failed to load calendar context:', error);
    }
  };

  const handleSendMessage = (message) => {
    // Add calendar context to message if relevant
    const enhancedMessage = calendarContext && message.toLowerCase().includes('calendar') 
      ? `${message}\n\nCalendar context: I have ${calendarContext.gaps?.length || 0} available time slots today.`
      : message;

    // ... existing message handling
    setMessages(prev => [...prev, {
      id: Date.now(),
      message: enhancedMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    }]);

    sendMessage(enhancedMessage);
    setIsLoading(true);
  };

  // ... rest of component
};
```

#### 3.2 Socket Events for Calendar
```javascript
// backend/server.js - Add calendar socket events
socket.on('calendar_sync_request', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analysis = await calendarService.analyzeCalendarGaps(socket.user.userId, new Date());
    const suggestions = analysis.map(gap => 
      calendarService.suggestFocusBlock(socket.user.userId, gap)
    );
    
    socket.emit('calendar_suggestions', {
      gaps: analysis,
      suggestions: await Promise.all(suggestions),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    socket.emit('calendar_error', { error: error.message });
  }
});

socket.on('focus_block_approved', async (data) => {
  try {
    const event = await calendarService.createEvent(socket.user.userId, data.focusBlock);
    socket.emit('focus_block_created', { event, timestamp: new Date().toISOString() });
  } catch (error) {
    socket.emit('calendar_error', { error: error.message });
  }
});
```

### Phase 4: Testing & Polish (Week 4)

#### 4.1 E2E Tests for Calendar
```javascript
// frontend/e2e/calendar.spec.js
import { test, expect } from '@playwright/test';

test.describe('Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in and navigate to calendar
    await page.goto('/');
    await page.click('text=Sign in with Google');
    // ... auth flow
    await page.click('[data-testid="calendar-tab"]');
  });

  test('should load calendar events', async ({ page }) => {
    await expect(page.locator('.rbc-calendar')).toBeVisible();
    await expect(page.locator('.rbc-event')).toHaveCount.greaterThan(0);
  });

  test('should show focus block suggestions', async ({ page }) => {
    await expect(page.locator('[data-testid="focus-suggestion"]')).toBeVisible();
  });

  test('should approve focus block suggestion', async ({ page }) => {
    await page.click('[data-testid="approve-focus-block"]');
    await expect(page.locator('text=Focus block added')).toBeVisible();
  });

  test('should switch calendar views', async ({ page }) => {
    await page.click('text=Week');
    await expect(page.locator('.rbc-time-view')).toBeVisible();
    
    await page.click('text=Day');
    await expect(page.locator('.rbc-day-view')).toBeVisible();
  });
});
```

#### 4.2 Calendar Styling
```css
/* frontend/src/components/Calendar/CalendarView.css */
.aura-calendar {
  --rbc-bg-color: var(--mantine-color-body);
  --rbc-border-color: var(--mantine-color-gray-3);
  --rbc-off-range-bg-color: var(--mantine-color-gray-0);
  --rbc-today-bg-color: var(--mantine-color-aura-0);
}

.aura-calendar .rbc-event {
  background-color: var(--mantine-color-aura-1);
  border-color: var(--mantine-color-aura-2);
  color: white;
}

.aura-calendar .rbc-event.focus-block {
  background-color: var(--mantine-color-aura-3);
  border-style: dashed;
  opacity: 0.8;
}

.aura-calendar .rbc-selected {
  background-color: var(--mantine-color-aura-2);
}

.aura-calendar .rbc-today {
  background-color: var(--mantine-color-aura-0);
}
```

## Key Features Implementation

### 1. AI-Powered Calendar Analysis
- **Gap Detection**: Scan calendar for 25+ minute gaps during work hours (8 AM - 6 PM)
- **Smart Suggestions**: Avoid back-to-back meetings, consider time of day preferences
- **Context Awareness**: Use task context and user preferences for better suggestions

### 2. View-Specific UX
- **Day View**: Full suggestion cards with detailed information
- **Week View**: Compact suggestion blocks in timeline gaps  
- **Month View**: Small badge indicators on empty time slots

### 3. Approval-Based Workflow
- All calendar changes require explicit user approval
- Suggestions are dismissible and non-intrusive
- Real-time updates via Socket.io

### 4. Chat Integration
- Calendar context automatically included in AI conversations
- Natural language calendar queries: "Find me 2 hours tomorrow"
- Suggestion mode: AI proposes, user approves via calendar UI

## Dependencies

### Backend
```json
{
  "googleapis": "^126.0.1",
  "moment": "^2.29.4"
}
```

### Frontend  
```json
{
  "react-big-calendar": "^1.8.2",
  "moment": "^2.29.4"
}
```

## Success Criteria
- [ ] Calendar loads and displays Google Calendar events
- [ ] AI detects calendar gaps and suggests focus blocks
- [ ] Users can approve/dismiss suggestions via UI
- [ ] Focus blocks are created in Google Calendar
- [ ] Chat interface includes calendar context
- [ ] All calendar views (Day/Week/Month) work responsively
- [ ] E2E tests pass for complete calendar workflow

## Risk Mitigation
- **Google API Rate Limits**: Implement caching and batch operations
- **Calendar Permissions**: Clear error handling for insufficient permissions  
- **Time Zone Handling**: Use moment.js for consistent time calculations
- **Performance**: Lazy load calendar data and optimize re-renders

This implementation plan builds incrementally on the existing AuraFlow infrastructure, focusing on minimal but powerful calendar features that enhance the mindful productivity experience without overwhelming the user.