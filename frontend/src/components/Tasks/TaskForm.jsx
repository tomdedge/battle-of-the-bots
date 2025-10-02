import { useState } from 'react';
import { Card, TextInput, Textarea, Button, Group } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';

export const TaskForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const taskData = {
        title: title.trim(),
        notes: notes.trim() || undefined
      };
      onSubmit(taskData);
      setTitle('');
      setNotes('');
    }
  };

  return (
    <Card p="md" withBorder>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Task Title"
          placeholder="Enter task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          mb="sm"
          autoFocus
        />
        
        <Textarea
          label="Notes (optional)"
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          mb="md"
          rows={2}
        />
        
        <Group justify="flex-end" gap="xs">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftSection={<IconPlus size={16} />}
            disabled={!title.trim()}
          >
            Add Task
          </Button>
        </Group>
      </form>
    </Card>
  );
};
