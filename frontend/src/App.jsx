import { useState } from 'react';
import { MantineProvider, ColorSchemeScript, AppShell } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { theme } from './theme';
import { Header } from './components/Navigation/Header';
import { BottomTabs } from './components/Navigation/BottomTabs';
import { ChatPlaceholder } from './components/Chat/ChatPlaceholder';
import { CalendarPlaceholder } from './components/Calendar/CalendarPlaceholder';
import { TasksPlaceholder } from './components/Tasks/TasksPlaceholder';
import { MeditationPlaceholder } from './components/Meditation/MeditationPlaceholder';
import '@mantine/core/styles.css';

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
        return <ChatPlaceholder />;
      case 'calendar':
        return <CalendarPlaceholder />;
      case 'tasks':
        return <TasksPlaceholder />;
      case 'meditation':
        return <MeditationPlaceholder />;
      default:
        return <ChatPlaceholder />;
    }
  };

  return (
    <>
      <ColorSchemeScript defaultColorScheme="light" />
      <MantineProvider theme={theme} defaultColorScheme="light">
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
        </AppShell>
      </MantineProvider>
    </>
  );
}

export default App;
