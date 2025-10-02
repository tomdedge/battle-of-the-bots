import { useState, useEffect } from 'react';
import { Stack, Paper, LoadingOverlay, Text, Button, Group, Select } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

export const TasksView = () => {
  const [tasks, setTasks] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('@default');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadTaskLists();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedListId) {
      loadTasks();
    }
  }, [token, selectedListId]);

  const loadTaskLists = async () => {
    try {
      const api = new ApiService(token);
      const response = await api.getTaskLists();
      setTaskLists(response.taskLists || []);
    } catch (error) {
      console.error('Failed to load task lists:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const api = new ApiService(token);
      const response = await api.getTasks(selectedListId);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      const api = new ApiService(token);
      await api.completeTask(taskId, selectedListId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      const api = new ApiService(token);
      await api.deleteTask(taskId, selectedListId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskCreate = async (taskData) => {
    try {
      const api = new ApiService(token);
      await api.createTask(taskData, selectedListId);
      setShowForm(false);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskUpdate = async (taskId, taskData) => {
    try {
      const api = new ApiService(token);
      await api.updateTask(taskId, taskData, selectedListId);
      await loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const incompleteTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Stack h="100%" gap="md" p="md">
      <Paper p="md">
        <Group justify="space-between">
          <Select
            placeholder="Select task list"
            value={selectedListId}
            onChange={setSelectedListId}
            data={taskLists.map(list => ({
              value: list.id,
              label: list.title
            }))}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowForm(true)}
          >
            Add Task
          </Button>
        </Group>
      </Paper>

      <Paper flex={1} pos="relative">
        <LoadingOverlay visible={loading} />
        
        <Stack gap="md" p="md">
          {showForm && (
            <TaskForm
              onSubmit={handleTaskCreate}
              onCancel={() => setShowForm(false)}
            />
          )}

          {incompleteTasks.length > 0 && (
            <Stack gap="xs">
              <Text fw={500} size="sm" c="dimmed">Active Tasks</Text>
              {incompleteTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={() => handleTaskComplete(task.id)}
                  onDelete={() => handleTaskDelete(task.id)}
                  onUpdate={(data) => handleTaskUpdate(task.id, data)}
                />
              ))}
            </Stack>
          )}

          {completedTasks.length > 0 && (
            <Stack gap="xs">
              <Text fw={500} size="sm" c="dimmed">Completed Tasks</Text>
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={() => handleTaskDelete(task.id)}
                  onUpdate={(data) => handleTaskUpdate(task.id, data)}
                />
              ))}
            </Stack>
          )}

          {tasks.length === 0 && !loading && (
            <Text ta="center" c="dimmed" py="xl">
              No tasks found. Create your first task!
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};
