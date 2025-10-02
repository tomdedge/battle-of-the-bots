import { Tabs, Center } from '@mantine/core';
import { IconMessageCircle, IconCalendar, IconChecklist, IconBrain } from '@tabler/icons-react';

export function BottomTabs({ activeTab, setActiveTab }) {
  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
      <Tabs.List grow style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--mantine-color-body)', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '8px' }}>
        <Tabs.Tab value="chat" leftSection={<IconMessageCircle size={16} />}>
          <Center>Chat</Center>
        </Tabs.Tab>
        <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
          <Center>Calendar</Center>
        </Tabs.Tab>
        <Tabs.Tab value="tasks" leftSection={<IconChecklist size={16} />}>
          <Center>Tasks</Center>
        </Tabs.Tab>
        <Tabs.Tab value="meditation" leftSection={<IconBrain size={16} />}>
          <Center>Meditation</Center>
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
