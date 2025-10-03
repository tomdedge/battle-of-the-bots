import { useState, useEffect } from 'react';
import { Stack, SegmentedControl, Paper, LoadingOverlay, Text, Group, Button, ActionIcon, Popover, Alert, ScrollArea, Box } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconAlertCircle } from '@tabler/icons-react';
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
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadCalendarData();
    }
  }, [date, view, token]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
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
      setError(true);
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

  const navigateDate = (action) => {
    const newDate = moment(date);
    if (action === 'prev') {
      newDate.subtract(1, view === 'agenda' ? 'month' : view);
    } else if (action === 'next') {
      newDate.add(1, view === 'agenda' ? 'month' : view);
    } else if (action === 'today') {
      setDate(new Date());
      return;
    }
    setDate(newDate.toDate());
  };

  const getDateLabel = () => {
    const m = moment(date);
    if (view === 'month' || view === 'agenda') {
      return m.format('MMMM YYYY');
    } else if (view === 'week') {
      const start = m.clone().startOf('week');
      const end = m.clone().endOf('week');
      
      if (start.month() === end.month()) {
        // Same month: "Oct 5-11, 2025"
        return `${start.format('MMM D')}-${end.format('D, YYYY')}`;
      } else {
        // Different months: "Sep 29 - Oct 5, 2025"
        return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
      }
    } else {
      return m.format('MMMM D, YYYY');
    }
  };

  const customFormats = {
    dayHeaderFormat: (date, culture, localizer) => {
      const dayName = moment(date).format('ddd');
      const dayNumber = moment(date).format('D');
      return `${dayName}\n${dayNumber}`;
    }
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
        backgroundColor: 'var(--mantine-color-aura-1)',
        border: '2px dashed var(--mantine-color-aura-2)',
        opacity: 0.7,
        color: 'white'
      };
    }
    return {
      backgroundColor: 'var(--mantine-color-blue-6)',
      border: '1px solid var(--mantine-color-blue-7)',
      color: 'white'
    };
  };

  return (
    <Stack
      h="100%"
      gap={0} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
        overflow: 'hidden',
      }}
    >
      <Box p="xs" pb={0}>
        <Paper p="md">
          <Group justify="space-between" align="center" wrap="nowrap">
            <ActionIcon 
              variant="subtle" 
              onClick={() => navigateDate('prev')}
              size="lg"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            
            <Text fw={500} size="lg" style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              {getDateLabel()}
            </Text>
            
            <ActionIcon 
              variant="subtle" 
              onClick={() => navigateDate('next')}
              size="lg"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
          
          <Group justify="center" mt="sm" gap="sm">
            <Button variant="light" onClick={() => navigateDate('today')}>
              Today
            </Button>
            <Popover width={300} position="bottom" withArrow shadow="md">
              <Popover.Target>
                <ActionIcon variant="subtle" size="lg">
                  <IconCalendar size={18} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <DatePicker
                  value={date}
                  onChange={(newDate) => newDate && setDate(newDate)}
                />
              </Popover.Dropdown>
            </Popover>
          </Group>
          
          <SegmentedControl
            value={view}
            onChange={setView}
            data={[
              { label: 'Month', value: 'month' },
              { label: 'Week', value: 'week' },
              { label: 'Day', value: 'day' },
              { label: 'Agenda', value: 'agenda' }
            ]}
            fullWidth
            mt="md"
          />
        </Paper>

        {error && (
          <Button 
            variant="default" 
            leftSection={<IconAlertCircle size={16} />}
            onClick={loadCalendarData}
            fullWidth
            mt="md"
            style={{ 
              height: 'auto', 
              padding: '12px',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              backgroundColor: '#fca5a5',
              borderColor: '#f87171',
              color: '#7f1d1d'
            }}
          >
            Failed to load calendar data.{'\n'}Click here to try again.
          </Button>
        )}

        {suggestions.length > 0 && view === 'day' && (
          <Text size="sm" ta="center" style={{ color: 'var(--mantine-color-gray-7)' }} m="md">
            💡 Dashed events are focus block suggestions - click to add to calendar
          </Text>
        )}
      </Box>

      <ScrollArea h={0} style={{ flex: 1 }} p="xs" pt={0}>
        <Paper pos="relative" p="md">
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
            formats={customFormats}
            style={{ height: '100%' }}
            components={{}}
          />
        </Paper>
      </ScrollArea>
    </Stack>
  );
};