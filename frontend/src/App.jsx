import { useState, useEffect } from 'react';
import { MantineProvider, ColorSchemeScript, AppShell } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TTSProvider } from './contexts/TTSContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Navigation/Header';
import { BottomTabs } from './components/Navigation/BottomTabs';
import { ChatInterface } from './components/Chat/ChatInterface';
import { CalendarView } from './components/Calendar/CalendarView';
import { TasksView } from './components/Tasks/TasksView';
import { MeditationPlaceholder } from './components/Meditation/MeditationPlaceholder';
import { MindfulnessSuggestionModal } from './components/Calendar/MindfulnessSuggestionModal';
import ApiService from './services/api';
import { InstallPrompt } from './components/InstallPrompt';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

function MainApp() {
  const [activeTab, setActiveTab] = useState('chat');
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });
  const [showMindfulnessModal, setShowMindfulnessModal] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      checkMindfulnessScheduled();
    }
  }, [token]);

  const checkMindfulnessScheduled = async () => {
    try {
      // Check if user was already prompted today
      const lastPrompt = localStorage.getItem('mindfulness_last_prompt');
      const today = new Date().toDateString();
      
      if (lastPrompt === today) {
        return; // Already prompted today
      }

      const api = new ApiService(token);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { events } = await api.getCalendarEvents(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      // Check if any mindfulness/meditation events exist today
      const hasMindfulness = events.some(event => 
        event.summary?.toLowerCase().includes('mindfulness') ||
        event.summary?.toLowerCase().includes('meditation') ||
        event.summary?.toLowerCase().includes('breathing')
      );

      if (!hasMindfulness) {
        // Find a good time slot (e.g., 2 PM if available)
        const suggested = findAvailableTime(events);
        setSuggestedTime(suggested);
        setShowMindfulnessModal(true);
      }
    } catch (error) {
      console.error('Failed to check mindfulness schedule:', error);
    }
  };

  const findAvailableTime = (events) => {
    const now = new Date();
    const preferredHour = 14; // 2 PM
    const suggested = new Date();
    suggested.setHours(preferredHour, 0, 0, 0);

    // If preferred time is in the past, suggest next available hour
    if (suggested <= now) {
      suggested.setTime(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      suggested.setMinutes(0, 0, 0);
    }

    // Simple check - if there's a conflict, move to next hour
    const hasConflict = events.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      return suggested >= eventStart && suggested < eventEnd;
    });

    if (hasConflict) {
      suggested.setTime(suggested.getTime() + 60 * 60 * 1000); // Move 1 hour later
    }

    return suggested;
  };

  const handleScheduleMindfulness = async (time) => {
    try {
      if (!time) {
        console.error('No time provided for mindfulness scheduling');
        return;
      }

      const api = new ApiService(token);
      const startTime = new Date(time);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 1000); // 10 minutes

      await api.createFocusBlock({
        summary: 'Mindfulness Break',
        description: 'Take a few minutes for mindful breathing and reflection',
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        colorId: '2' // Green color
      });

      // Mark as prompted today
      localStorage.setItem('mindfulness_last_prompt', new Date().toDateString());
    } catch (error) {
      console.error('Failed to schedule mindfulness:', error);
    }
  };

  const handleCancelMindfulness = () => {
    // Don't prompt again for 1 hour
    const nextPrompt = new Date(Date.now() + 60 * 60 * 1000);
    localStorage.setItem('mindfulness_next_prompt', nextPrompt.toISOString());
  };

  const handleDismissToday = () => {
    // Don't prompt again until 6am tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    localStorage.setItem('mindfulness_last_prompt', new Date().toDateString());
    localStorage.setItem('mindfulness_next_prompt', tomorrow.toISOString());
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'calendar':
        return <CalendarView />;
      case 'tasks':
        return <TasksView />;
      case 'meditation':
        return <MeditationPlaceholder />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      style={{
        backgroundColor: colorScheme === 'dark' ? theme.other.backgroundDark : theme.other.backgroundLight,
        minHeight: '100vh'
      }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      
      <AppShell.Main style={{ paddingBottom: 'calc(60px + var(--mantine-spacing-md))' }}>
        {renderContent()}
      </AppShell.Main>
      
      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <MindfulnessSuggestionModal
        opened={showMindfulnessModal}
        onClose={() => setShowMindfulnessModal(false)}
        suggestedTime={suggestedTime}
        onSchedule={handleScheduleMindfulness}
        onCancel={handleCancelMindfulness}
        onDismissToday={handleDismissToday}
      />
    </AppShell>
  );
}

function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="light" />
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthProvider>
          <TTSProvider>
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          </TTSProvider>
        </AuthProvider>
      </MantineProvider>
    </>
  );
}

export default App;
