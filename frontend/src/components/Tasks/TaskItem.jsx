import { useState } from 'react';
import { Card, Text, Group, ActionIcon, Checkbox, Menu, TextInput, Button } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import moment from 'moment';

export const TaskItem = ({ task, onComplete, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || '');

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate({ title: editTitle.trim() });
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title || '');
    setEditing(false);
  };

  const isCompleted = task.status === 'completed';
  const dueDate = task.due ? moment(task.due).format('MMM D, YYYY') : null;

  return (
    <Card p="sm" withBorder>
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" style={{ flex: 1 }}>
          {onComplete && !isCompleted && (
            <Checkbox
              checked={false}
              onChange={onComplete}
              mt={2}
            />
          )}
          
          <div style={{ flex: 1 }}>
            {editing ? (
              <Group gap="xs">
                <TextInput
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <ActionIcon
                  size="sm"
                  color="green"
                  onClick={handleSaveEdit}
                >
                  <IconCheck size={14} />
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  color="gray"
                  onClick={handleCancelEdit}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            ) : (
              <>
                <Text
                  size="sm"
                  fw={500}
                  td={isCompleted ? 'line-through' : 'none'}
                  c={isCompleted ? 'dimmed' : 'inherit'}
                >
                  {task.title || 'Untitled Task'}
                </Text>
                
                {task.notes && (
                  <Text size="xs" c="dimmed" mt={2}>
                    {task.notes}
                  </Text>
                )}
                
                {dueDate && (
                  <Text size="xs" c="dimmed" mt={2}>
                    Due: {dueDate}
                  </Text>
                )}
                
                {isCompleted && task.completed && (
                  <Text size="xs" c="dimmed" mt={2}>
                    Completed: {moment(task.completed).format('MMM D, YYYY')}
                  </Text>
                )}
              </>
            )}
          </div>
        </Group>

        {!editing && (
          <Menu shadow="md" width={120}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={onDelete}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Card>
  );
};
