import { Modal, Stack, TextInput, Textarea, Button, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useState, useEffect } from 'react';

export function EventDetailModal({ event, opened, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || event.summary || '');
      setDescription(event.description || '');
      setStartDate(new Date(event.start));
      setEndDate(new Date(event.end));
    }
  }, [event]);

  const handleSave = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    
    setLoading(true);
    try {
      await onUpdate({
        ...event,
        title,
        description,
        start: startDate,
        end: endDate
      });
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(event);
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Event Details"
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        
        <DateTimePicker
          label="Start Date & Time"
          value={startDate}
          onChange={setStartDate}
          required
        />
        
        <DateTimePicker
          label="End Date & Time"
          value={endDate}
          onChange={setEndDate}
          required
        />
        
        <Group justify="space-between" mt="md">
          <Button
            variant="light"
            color="red"
            onClick={handleDelete}
            loading={loading}
          >
            Delete Event
          </Button>
          
          <Group>
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
