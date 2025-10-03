import { useState, useEffect } from 'react';
import { Stack, SegmentedControl, Paper, LoadingOverlay, Text, Group, Button, ActionIcon, Popover, Alert, ScrollArea, Box } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconAlertCircle } from '@tabler/icons-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { SessionTimer } from '../Session/SessionTimer';
import { SuggestionConfirmModal } from './SuggestionConfirmModal';
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
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
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
      
      // Get events first
      const eventsResponse = await api.getCalendarEvents(start.toISOString(), end.toISOString());

      // Transform actual events
      const actualEvents = (eventsResponse.events || []).map(event => ({
        ...event,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        title: event.summary || 'Untitled Event',
        type: 'actual'
      }));

      let suggestionEvents = [];
      let allSuggestions = [];

      // Only get suggestions for day and week views
      if (view === 'day' || view === 'week') {
        // Calculate days to analyze based on view and date range
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const daysToAnalyze = Math.min(daysDiff, 7); // Cap at 7 days for performance
        
        console.log(`Analyzing ${daysToAnalyze} days from ${start.toDateString()} to ${end.toDateString()}`);
        
        try {
          const analysisResponse = await api.analyzeCalendar(start.toISOString().split('T')[0], daysToAnalyze);
          console.log('Analysis response:', analysisResponse);

          // Transform suggestions into ghost events
          suggestionEvents = (analysisResponse.suggestions || [])
            .filter(suggestion => {
              // Only show suggestions within the current view's date range
              const suggestionDate = new Date(suggestion.start.dateTime);
              return suggestionDate >= start && suggestionDate <= end;
            })
            .map(suggestion => ({
              start: new Date(suggestion.start.dateTime),
              end: new Date(suggestion.end.dateTime),
              title: suggestion.title,
              type: 'suggestion',
              suggestion: suggestion
            }));

          allSuggestions = analysisResponse.suggestions || [];
        } catch (analysisError) {
          console.error('Failed to analyze calendar:', analysisError);
          // Continue without suggestions rather than failing completely
        }
      }

      console.log(`Loaded ${actualEvents.length} actual events and ${suggestionEvents.length} suggestions for ${view} view`);

      // Combine actual events and suggestions
      setEvents([...actualEvents, ...suggestionEvents]);
      setSuggestions(allSuggestions);
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

  const handleSessionComplete = async () => {
    // Optionally add completed session to calendar
    if (activeSession?.suggestion) {
      try {
        const api = new ApiService(token);
        await api.createFocusBlock(activeSession.suggestion);
        await loadCalendarData();
      } catch (error) {
        console.error('Failed to add session to calendar:', error);
      }
    }
  };

  const handleSessionClose = () => {
    setActiveSession(null);
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
      // Show confirmation modal for suggestions
      setSelectedSuggestion(event.suggestion);
    }
  };

  const handleScheduleSuggestion = async (suggestion) => {
    try {
      const api = new ApiService(token);
      await api.createFocusBlock(suggestion);
      await loadCalendarData(); // Refresh to show the new event
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Failed to schedule focus block:', error);
    }
  };

  const handleCloseSuggestionModal = () => {
    setSelectedSuggestion(null);
  };

  const eventPropGetter = (event) => {
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

        {suggestions.length > 0 && (view === 'day' || view === 'week') && (
          <Text size="sm" ta="center" c="dimmed" m="md">
            Dashed events are focus block suggestions ({suggestions.length} found) - click to start session
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
            eventPropGetter={eventPropGetter}
            formats={customFormats}
            style={{ height: '100%' }}
            components={{}}
          />
        </Paper>
      </ScrollArea>

      {activeSession && (
        <SessionTimer
          duration={activeSession.duration}
          title={activeSession.title}
          onComplete={handleSessionComplete}
          onClose={handleSessionClose}
        />
      )}

      <SuggestionConfirmModal
        suggestion={selectedSuggestion}
        opened={!!selectedSuggestion}
        onClose={handleCloseSuggestionModal}
        onSchedule={handleScheduleSuggestion}
      />
    </Stack>
  );
};