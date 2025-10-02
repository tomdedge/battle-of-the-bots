import { useState } from 'react';
import { MantineProvider, ColorSchemeScript, AppShell } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Navigation/Header';
import { BottomTabs } from './components/Navigation/BottomTabs';
import { ChatInterface } from './components/Chat/ChatInterface';
import { CalendarView } from './components/Calendar/CalendarView';
import { TasksView } from './components/Tasks/TasksView';
import { MeditationPlaceholder } from './components/Meditation/MeditationPlaceholder';
import { InstallPrompt } from './components/InstallPrompt';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

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
    <>
      <ColorSchemeScript defaultColorScheme="light" />
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthProvider>
          <ProtectedRoute>
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
              
              <AppShell.Main style={{ paddingBottom: '80px' }}>
                {renderContent()}
              </AppShell.Main>
              
              <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <InstallPrompt />
            </AppShell>
          </ProtectedRoute>
        </AuthProvider>
      </MantineProvider>
    </>
  );
}

export default App;
