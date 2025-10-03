import { Modal, Stack, Title, Text, Group, Button } from '@mantine/core';
import { IconCalendarPlus, IconX } from '@tabler/icons-react';

export function SuggestionConfirmModal({ suggestion, opened, onClose, onSchedule }) {
  if (!suggestion) return null;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Schedule Focus Block?" 
      centered
      size="md"
    >
      <Stack gap="lg">
        <div>
          <Title order={4} mb="xs">{suggestion.title}</Title>
          <Text c="dimmed" size="sm">
            {formatDate(suggestion.start.dateTime)} • {formatTime(suggestion.start.dateTime)} - {formatTime(suggestion.end.dateTime)}
          </Text>
        </div>

        {suggestion.description && (
          <Text size="sm">{suggestion.description}</Text>
        )}

        <Text size="sm" c="dimmed">
          Would you like to add this focus block to your Google Calendar?
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button 
            variant="subtle" 
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            leftSection={<IconCalendarPlus size={16} />}
            onClick={() => onSchedule(suggestion)}
          >
            Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
