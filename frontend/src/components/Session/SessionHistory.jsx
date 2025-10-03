import { useState, useEffect } from 'react';
import { Stack, Title, Text, Card, Group, Badge, ScrollArea } from '@mantine/core';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';

export function SessionHistory() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
    setSessions(savedSessions.reverse()); // Show most recent first
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (sessions.length === 0) {
    return (
      <Stack align="center" gap="md" py="xl">
        <IconClock size={48} color="gray" />
        <Text c="dimmed" ta="center">
          No focus sessions yet. Start your first session from the calendar!
        </Text>
      </Stack>
    );
  }

  return (
    <ScrollArea h="100%">
      <Stack gap="md" p="md">
        <Title order={3}>Recent Sessions</Title>
        {sessions.map((session, index) => (
          <Card key={index} withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text fw={500}>{session.title}</Text>
                <Text size="sm" c="dimmed">
                  {formatDate(session.completedAt)}
                </Text>
              </Stack>
              <Group gap="xs">
                <Badge 
                  color={session.wasCompleted ? 'green' : 'orange'}
                  leftSection={session.wasCompleted ? <IconCheck size={12} /> : <IconX size={12} />}
                >
                  {session.duration} min
                </Badge>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </ScrollArea>
  );
}
