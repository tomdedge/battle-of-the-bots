import { Card, Text, Group, Button, Badge, Stack } from '@mantine/core';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';
import moment from 'moment';

export const FocusBlockSuggestion = ({ suggestion, view, onApprove, onDismiss }) => {
  const formatTime = (dateString) => {
    return moment(dateString).format('h:mm A');
  };

  const getDuration = () => {
    const start = moment(suggestion.start.dateTime);
    const end = moment(suggestion.end.dateTime);
    return end.diff(start, 'minutes');
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute',
      zIndex: 1000,
    };

    if (view === 'day') {
      return { ...baseStyle, top: '20px', right: '20px', maxWidth: '300px' };
    } else if (view === 'week') {
      return { ...baseStyle, top: '10px', right: '10px', maxWidth: '250px' };
    } else {
      return { ...baseStyle, top: '10px', right: '10px', maxWidth: '200px' };
    }
  };

  if (view === 'month') {
    return (
      <Card style={getPositionStyle()} p="xs" shadow="md">
        <Group gap="xs">
          <Badge color="aura.1" size="sm">
            Focus {getDuration()}m
          </Badge>
          <Button size="xs" variant="light" onClick={onApprove}>
            <IconCheck size={12} />
          </Button>
          <Button size="xs" variant="light" color="gray" onClick={onDismiss}>
            <IconX size={12} />
          </Button>
        </Group>
      </Card>
    );
  }

  return (
    <Card style={getPositionStyle()} p="md" shadow="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500} size="sm">Focus Block Available</Text>
          <Badge color="aura.1" leftSection={<IconClock size={12} />}>
            {getDuration()} min
          </Badge>
        </Group>
        
        <Text size="sm" c="dimmed">
          {formatTime(suggestion.start.dateTime)} - {formatTime(suggestion.end.dateTime)}
        </Text>
        
        {suggestion.description && (
          <Text size="xs" c="dimmed">
            {suggestion.description}
          </Text>
        )}
        
        <Group gap="xs" justify="flex-end">
          <Button 
            size="xs" 
            variant="light" 
            color="gray" 
            onClick={onDismiss}
            leftSection={<IconX size={12} />}
          >
            Dismiss
          </Button>
          <Button 
            size="xs" 
            onClick={onApprove}
            leftSection={<IconCheck size={12} />}
          >
            Add to Calendar
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};