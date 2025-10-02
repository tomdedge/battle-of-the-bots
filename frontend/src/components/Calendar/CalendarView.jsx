import { useState, useEffect } from 'react';
import { Stack, SegmentedControl, Paper, LoadingOverlay, Text } from '@mantine/core';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const localizer = momentLocalizer(moment);

export const CalendarView = () => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadCalendarData();
    }
  }, [date, view, token]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const api = new ApiService(token);
      const { start, end } = getDateRange(date, view);
      
      const [eventsResponse, analysisResponse] = await Promise.all([
        api.getCalendarEvents(start.toISOString(), end.toISOString()),
        api.analyzeCalendar(date.toISOString().split('T')[0])
      ]);

      // Transform actual events
      const actualEvents = (eventsResponse.events || []).map(event => ({
        ...event,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        title: event.summary || 'Untitled Event',
        type: 'actual'
      }));

      // Transform suggestions into ghost events (only for day view)
      const suggestionEvents = view === 'day' 
        ? (analysisResponse.suggestions || []).map(suggestion => ({
            start: new Date(suggestion.start.dateTime),
            end: new Date(suggestion.end.dateTime),
            title: suggestion.title,
            type: 'suggestion',
            suggestion: suggestion
          }))
        : [];

      // Combine actual events and suggestions
      setEvents([...actualEvents, ...suggestionEvents]);
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
      const api = new ApiService(token);
      await api.createFocusBlock(suggestion);
      await loadCalendarData();
    } catch (error) {
      console.error('Failed to create focus block:', error);
    }
  };

  const handleSuggestionDismiss = (suggestion) => {
    // Remove suggestion from events
    setEvents(prev => prev.filter(event => 
      event.type !== 'suggestion' || event.suggestion !== suggestion
    ));
  };

  const handleEventClick = (event) => {
    if (event.type === 'suggestion') {
      // Show approve/dismiss options for suggestions
      const confirmed = window.confirm(`Add "${event.title}" to your calendar?`);
      if (confirmed) {
        handleSuggestionApprove(event.suggestion);
      } else {
        handleSuggestionDismiss(event.suggestion);
      }
    }
  };

  const eventStyleGetter = (event) => {
    if (event.type === 'suggestion') {
      return {
        style: {
          backgroundColor: 'var(--mantine-color-aura-1)',
          border: '2px dashed var(--mantine-color-aura-2)',
          opacity: 0.7,
          color: 'white'
        }
      };
    }
    return {
      style: {
        backgroundColor: 'var(--mantine-color-blue-6)',
        border: '1px solid var(--mantine-color-blue-7)',
        color: 'white'
      }
    };
  };

  return (
    <Stack h="100%" gap="lg">
      <Paper p="md">
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

      {suggestions.length > 0 && view === 'day' && (
        <Text size="sm" ta="center" style={{ color: 'var(--mantine-color-gray-7)' }}>
          💡 Dashed events are focus block suggestions - click to add to calendar
        </Text>
      )}

      <Paper flex={1} pos="relative" style={{ minHeight: '500px' }} p="md">
        <LoadingOverlay visible={loading} />
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
        />
      </Paper>
    </Stack>
  );
};