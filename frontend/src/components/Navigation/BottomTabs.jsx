import { Tabs, Center } from '@mantine/core';
import { IconMessageCircle, IconCalendar, IconChecklist, IconBrain } from '@tabler/icons-react';
import './BottomTabs.css';

export function BottomTabs({ activeTab, setActiveTab }) {
  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md" data-testid="bottom-tabs">
      <Tabs.List grow style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--mantine-color-body)', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '8px', flexWrap: 'nowrap', minHeight: '60px' }}>
        <Tabs.Tab value="chat" leftSection={<IconMessageCircle size={16} />} data-testid="chat-tab">
          <Center className="tab-label">Chat</Center>
        </Tabs.Tab>
        <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />} data-testid="calendar-tab">
          <Center className="tab-label">Calendar</Center>
        </Tabs.Tab>
        <Tabs.Tab value="tasks" leftSection={<IconChecklist size={16} />} data-testid="tasks-tab">
          <Center className="tab-label">Tasks</Center>
        </Tabs.Tab>
        <Tabs.Tab value="meditation" leftSection={<IconBrain size={16} />} data-testid="meditation-tab">
          <Center className="tab-label">Meditation</Center>
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
