import { useState, useEffect } from 'react';
import { Stack, Paper, LoadingOverlay, Text, Button, Group, Select, ScrollArea, Box } from '@mantine/core';
import { IconPlus, IconCalendarPlus } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import ApiService from '../../services/api';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { AuroraResponseModal } from './AuroraResponseModal';

export const TasksView = () => {
  const [tasks, setTasks] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('@default');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [auroraModal, setAuroraModal] = useState({ opened: false, response: '', isLoading: false });
  const { token } = useAuth();
  const { sendTaskMessage, sendAuroraMessage, injectAuroraMessage } = useSocket();

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

  const scheduleTask = async (task) => {
    setAuroraModal({ opened: true, response: '', isLoading: true });
    
    try {
      // Pre-fetch calendar data to give Aurora context
      const api = new ApiService(token);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const eventsResponse = await api.getCalendarEvents(
        today.toISOString(), 
        tomorrow.toISOString()
      );
      
      const events = eventsResponse.events || [];
      const eventSummary = events.length === 0 
        ? "Your calendar is completely free today."
        : `Your calendar today has ${events.length} events:\n${events.map(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            const end = new Date(event.end.dateTime || event.end.date);
            return `- ${event.summary}: ${start.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})} to ${end.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})}`;
          }).join('\n')}`;

      // Create focused prompt with calendar context
      const prompt = `CALENDAR CONTEXT:
${eventSummary}

TASK TO SCHEDULE: "${task.title}"
${task.notes ? `Notes: ${task.notes}` : ''}
${task.due ? `Due date: ${task.due}` : ''}

YOUR JOB: Use calendar_create_event to schedule this task as a 30-minute event.
- Find the best available time slot based on the calendar above
- Use the exact task title: "${task.title}"
- Format: {"summary": "${task.title}", "start": {"dateTime": "2025-10-03T09:30:00-06:00"}, "end": {"dateTime": "2025-10-03T10:00:00-06:00"}}

Execute calendar_create_event now with your chosen time slot.`;

      // Set up response handler
      const handleResponse = async (responseData) => {
        const message = typeof responseData === 'string' ? responseData : responseData?.message?.message || responseData?.message || 'Task scheduled!';
        
        console.log('Task scheduling response received:', message);
        console.log('Full responseData:', responseData);
        
        // Check if Aurora successfully executed calendar_create_event tool
        let eventWasCreated = false;
        try {
          // Check toolResults from server response - could be nested in message object
          const toolResults = responseData?.message?.toolResults || responseData?.toolResults || [];
          console.log('Tool execution results:', toolResults);
          
          const calendarToolResult = toolResults.find(tool => 
            tool.tool === 'calendar_create_event' && tool.success === true
          );
          
          if (calendarToolResult) {
            console.log('✅ Aurora successfully created calendar event:', calendarToolResult);
            eventWasCreated = true;
          } else {
            console.log('❌ No successful calendar_create_event tool execution found');
          }
          
          console.log('Final eventWasCreated value:', eventWasCreated);
          
          if (eventWasCreated) {
            console.log('🎉 Event was successfully created - updating task and showing success modal');
            // Update task title ourselves
            try {
              await api.updateTask(task.id, { title: `[Scheduled] ${task.title}` }, selectedListId);
              console.log('✅ Updated task title with [Scheduled] tag');
            } catch (updateError) {
              console.error('Failed to update task title:', updateError);
            }
            
            // Show Aurora's success response
            setAuroraModal({ 
              opened: true, 
              response: message, 
              isLoading: false 
            });
          } else {
            console.log('❌ Event was NOT created - sending follow-up to main chat');
            
            // Aurora failed - escalate to main chat
            const followUpMessage = `I had trouble scheduling your task "${task.title}". Here are the details:

Task: ${task.title}
${task.notes ? `Notes: ${task.notes}` : ''}
${task.due ? `Due date: ${task.due}` : ''}

Calendar context:
${eventSummary}

Let's work together to find the perfect time for this task. What time would work best for you?`;

            console.log('📤 Attempting to send follow-up message to main chat:', followUpMessage);
            console.log('📤 injectAuroraMessage function available:', !!injectAuroraMessage);
            console.log('📤 injectAuroraMessage function type:', typeof injectAuroraMessage);
            
            if (injectAuroraMessage) {
              console.log('✅ Calling injectAuroraMessage with follow-up message');
              injectAuroraMessage(followUpMessage);
              console.log('✅ injectAuroraMessage call completed');
              
              // Also add a visual confirmation in the modal
              setTimeout(() => {
                console.log('✅ Follow-up message should now be visible in main chat');
              }, 100);
            } else {
              console.log('❌ injectAuroraMessage function is NOT available');
            }
            
            // Show failure response with promise to follow up
            setAuroraModal({ 
              opened: true, 
              response: `${message}\n\nI'll follow up with you in the main chat to help find the perfect time for this task.`, 
              isLoading: false 
            });
          }
          
          // Only check for follow-up promises when event creation failed
          if (!eventWasCreated && typeof message === 'string' && (message.includes("I'll follow up") || message.includes("follow up"))) {
            console.log('🔍 Detected follow-up promise in Aurora\'s message, sending additional follow-up');
            const followUpMessage = `I had trouble scheduling your task "${task.title}". Here are the details:

Task: ${task.title}
${task.notes ? `Notes: ${task.notes}` : ''}
${task.due ? `Due date: ${task.due}` : ''}

Calendar context:
${eventSummary}

Let's work together to find the perfect time for this task. What time would work best for you?`;

            if (injectAuroraMessage) {
              console.log('📤 Sending Aurora follow-up message to main chat (detected follow-up promise)');
              console.log('📤 Follow-up promise message:', followUpMessage);
              injectAuroraMessage(followUpMessage);
              console.log('✅ Follow-up promise message sent');
            } else {
              console.log('❌ injectAuroraMessage not available for follow-up promise');
            }
          }
        } catch (parseError) {
          console.error('Failed to parse tool execution results:', parseError);
          setAuroraModal({ 
            opened: true, 
            response: message, 
            isLoading: false 
          });
        }
        
        // Refresh tasks to show any [Scheduled] tags
        setTimeout(() => loadTasks(), 1000);
      };

      // Send message via socket
      sendTaskMessage(prompt, handleResponse);
      
    } catch (error) {
      console.error('Failed to prepare task scheduling:', error);
      setAuroraModal({ 
        opened: true, 
        response: 'Sorry, I had trouble accessing your calendar. Please try again.', 
        isLoading: false 
      });
    }
  };

  const scheduleAllTasks = async () => {
    const unscheduledTasks = incompleteTasks.filter(task => !task.title?.includes('[Scheduled]'));
    
    if (unscheduledTasks.length === 0) {
      setAuroraModal({ 
        opened: true, 
        response: 'All your tasks are already scheduled!', 
        isLoading: false 
      });
      return;
    }

    setAuroraModal({ opened: true, response: '', isLoading: true });
    
    const taskList = unscheduledTasks.map(task => 
      `- ${task.title}${task.notes ? ` (${task.notes})` : ''}`
    ).join('\n');
    
    const prompt = `I need you to schedule these tasks in my calendar. Start by getting my calendar events, then create calendar events for each task, then update the task titles.

Tasks to schedule:
${taskList}

Step 1: Use calendar_get_events to check my current calendar for today and tomorrow
Step 2: Use calendar_create_event for "Do dishes after 6pm but before 9pm" - find a 30-minute slot between 6-9pm today
Step 3: Use calendar_create_event for "6pm Movie tomorrow (Mission Impossible)" - schedule for 6pm tomorrow, 2 hours duration
Step 4: Use tasks_update_task to add [Scheduled] to the beginning of each task title

Execute ALL these steps. If successful, respond: "Successfully scheduled all ${unscheduledTasks.length} tasks!"
If any step fails, respond: "I had trouble scheduling some tasks. Let's work on this together in the main chat - I'll send you the details there."`;

    // Set up one-time listener for AI response
    const handleResponse = (responseData) => {
      // Extract message from nested response object
      const message = typeof responseData === 'string' 
        ? responseData 
        : responseData?.message?.message || responseData?.message || `Scheduled ${unscheduledTasks.length} tasks successfully!`;
      
      console.log('🔍 Final extracted message:', message);
      console.log('🔍 Final message type:', typeof message);
      
      // Check if Aurora had trouble scheduling tasks (more flexible matching)
      if (typeof message === 'string' && (message.includes("trouble scheduling") || message.includes("Let's work on this together") || message.includes("scheduling issue"))) {
        // Send follow-up message to main chat
        const taskList = unscheduledTasks.map(task => 
          `- ${task.title}${task.notes ? ` (${task.notes})` : ''}`
        ).join('\n');
        
        const followUpMessage = `I had trouble scheduling some of your tasks. Here's what I was trying to schedule:

${taskList}

Let's work together to find good times for these tasks. Would you like me to try scheduling them one by one, or do you have specific time preferences?`;

        // Send to main chat as Aurora message
        if (injectAuroraMessage) {
          injectAuroraMessage(followUpMessage);
        }
      }
      
      setAuroraModal({ 
        opened: true, 
        response: message, 
        isLoading: false 
      });
      
      // Refresh tasks to show [Scheduled] tags
      loadTasks();
    };

    // Send message via socket without storing in chat history
    sendTaskMessage(prompt, handleResponse);
  };

  const incompleteTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Stack
      h="100%"
      gap={8}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
        overflow: 'hidden',
      }}
    >
      <Box pb={0}>
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
            <Group gap="sm">
              <Button
                leftSection={<IconCalendarPlus size={16} />}
                onClick={scheduleAllTasks}
                variant="light"
                disabled={incompleteTasks.filter(task => !task.title?.includes('[Scheduled]')).length === 0}
              >
                Schedule All
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
              >
                Add Task
              </Button>
            </Group>
          </Group>
        </Paper>
      </Box>

      <ScrollArea h={0} style={{ flex: 1 }} pt={0}>
        <Paper p="md" pos="relative" h="100%" style={{ minHeight: '100vh' }}>
          <LoadingOverlay visible={loading} />
          
          <Stack gap="md">
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
                  onSchedule={scheduleTask}
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
      </ScrollArea>

      <AuroraResponseModal
        opened={auroraModal.opened}
        onClose={() => setAuroraModal({ opened: false, response: '', isLoading: false })}
        response={auroraModal.response}
        isLoading={auroraModal.isLoading}
      />
    </Stack>
  );
};
