import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Button, Group, TextInput } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconClock, IconCalendarPlus, IconX } from '@tabler/icons-react';

export const MindfulnessSuggestionModal = ({ 
  opened, 
  onClose, 
  suggestedTime, 
  onSchedule, 
  onCancel,
  onDismissToday 
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(suggestedTime || new Date());
  const [timeString, setTimeString] = useState('');
  const [showTimeError, setShowTimeError] = useState(false);

  // Update selectedTime when suggestedTime changes
  useEffect(() => {
    if (suggestedTime) {
      setSelectedTime(suggestedTime);
      setTimeString(formatTimeForInput(suggestedTime));
    }
  }, [suggestedTime]);

  const formatTimeForInput = (date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (value) => {
    // Handle case where value might be an event object
    let timeStr = value;
    if (value && typeof value === 'object') {
      if (value.target && value.target.value) {
        timeStr = value.target.value; // Event object
      } else if (value instanceof Date) {
        timeStr = formatTimeForInput(value); // Date object
      } else {
        console.warn('Unexpected time value type:', typeof value, value);
        return;
      }
    }
    
    setTimeString(timeStr);
    if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const newTime = new Date(selectedTime);
      newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Check if time is in the past
      const now = new Date();
      if (newTime <= now) {
        setShowTimeError(true);
        // Set to next available time (current time + 5 minutes)
        const minTime = new Date(now.getTime() + 5 * 60 * 1000);
        minTime.setSeconds(0, 0);
        setSelectedTime(minTime);
        setTimeString(formatTimeForInput(minTime));
        // Hide error after auto-correction
        setTimeout(() => setShowTimeError(false), 2000);
        return;
      }
      
      setShowTimeError(false);
      setSelectedTime(newTime);
    }
  };

  const getMinTime = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    return formatTimeForInput(minTime);
  };

  const handleSchedule = () => {
    onSchedule(selectedTime);
    onClose();
  };

  const handleDismissToday = () => {
    onDismissToday();
    onClose();
  };

  const handleXClose = () => {
    onCancel(); // 1 hour delay
    onClose();
  };

  const handleModifyTime = () => {
    setTimeString(formatTimeForInput(selectedTime));
    setShowTimePicker(true);
  };

  const formatTime = (date) => {
    if (!date || typeof date.toLocaleTimeString !== 'function') return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!suggestedTime) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleXClose}
      title="Mindfulness Reminder"
      centered
      size="md"
      closeOnClickOutside={false}
    >
      <Stack gap="lg">
        <Text size="lg" fw={500}>
          How about a mindfulness break today?
        </Text>
        
        <Text c="dimmed">
          Taking a few minutes for mindfulness can help improve focus and reduce stress. 
          We found an open slot at {formatTime(suggestedTime)}.
        </Text>

        {showTimePicker ? (
          <Stack gap="md">
            <Text size="sm" fw={500}>Choose a different time:</Text>
            <TimeInput
              value={timeString}
              onChange={handleTimeChange}
              label="Preferred time"
              leftSection={<IconClock size={16} />}
              min={getMinTime()}
              error={showTimeError ? 'Please select a future time' : null}
            />
            <Group justify="flex-end">
              <Button 
                variant="subtle" 
                onClick={() => setShowTimePicker(false)}
              >
                Back
              </Button>
              <Button 
                leftSection={<IconCalendarPlus size={16} />}
                onClick={handleSchedule}
              >
                Schedule at {formatTime(selectedTime)}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Group justify="space-between">
            <Button
              variant="subtle"
              leftSection={<IconX size={16} />}
              onClick={handleDismissToday}
            >
              Don't ask again today
            </Button>
            
            <Group gap="sm">
              <Button
                variant="outline"
                leftSection={<IconClock size={16} />}
                onClick={handleModifyTime}
              >
                Modify time
              </Button>
              
              <Button
                leftSection={<IconCalendarPlus size={16} />}
                onClick={handleSchedule}
                size="md"
              >
                Schedule this
              </Button>
            </Group>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
