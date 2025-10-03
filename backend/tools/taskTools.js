const tasksService = require('../services/tasksService');

class TaskTools {
  static getToolDefinitions() {
    return [
      {
        name: 'tasks_create_task',
        description: 'Create a new task',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            title: { type: 'string', description: 'Task title' },
            notes: { type: 'string', description: 'Task notes/description' },
            due: { type: 'string', description: 'Due date (ISO format)' },
            taskListId: { type: 'string', description: 'Task list ID (defaults to @default)' }
          },
          required: ['userId', 'title']
        }
      },
      {
        name: 'tasks_get_tasks',
        description: 'Get tasks from a task list',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            taskListId: { type: 'string', description: 'Task list ID (defaults to @default)' },
            showCompleted: { type: 'boolean', description: 'Include completed tasks' }
          },
          required: ['userId']
        }
      },
      {
        name: 'tasks_update_task',
        description: 'Update an existing task by ID or by name. Provide either taskId OR taskName.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            taskId: { type: 'string', description: 'Task ID (if known)' },
            taskName: { type: 'string', description: 'Task name/title to search for and update' },
            title: { type: 'string', description: 'New task title' },
            notes: { type: 'string', description: 'Task notes/description' },
            due: { type: 'string', description: 'Due date (ISO format)' },
            status: { type: 'string', enum: ['needsAction', 'completed'], description: 'Task status' },
            taskListId: { type: 'string', description: 'Task list ID (defaults to @default)' }
          },
          required: ['userId']
        }
      },
      {
        name: 'tasks_delete_task',
        description: 'Delete a task by ID or by name. Provide either taskId OR taskName.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            taskId: { type: 'string', description: 'Task ID (if known)' },
            taskName: { type: 'string', description: 'Task name/title to search for and delete' },
            taskListId: { type: 'string', description: 'Task list ID (defaults to @default)' }
          },
          required: ['userId']
        }
      },
      {
        name: 'tasks_complete_task',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            taskId: { type: 'string', description: 'Task ID' },
            taskListId: { type: 'string', description: 'Task list ID (defaults to @default)' }
          },
          required: ['userId', 'taskId']
        }
      },
      {
        name: 'tasks_get_task_lists',
        description: 'Get all task lists for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['userId']
        }
      }
    ];
  }

  static async executeTool(toolName, args) {
    switch (toolName) {
      case 'tasks_create_task':
        return await this.createTask(args);
      case 'tasks_get_tasks':
        return await this.getTasks(args);
      case 'tasks_update_task':
        return await this.updateTask(args);
      case 'tasks_delete_task':
        return await this.deleteTask(args);
      case 'tasks_complete_task':
        return await this.completeTask(args);
      case 'tasks_get_task_lists':
        return await this.getTaskLists(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  static async createTask(args) {
    const { userId, title, notes, due, taskListId = '@default' } = args;
    
    const taskData = {
      title,
      notes,
      due: due ? new Date(due).toISOString() : undefined
    };

    return await tasksService.createTask(userId, taskData, taskListId);
  }

  static async getTasks(args) {
    const { userId, taskListId = '@default' } = args;
    return await tasksService.getTasks(userId, taskListId);
  }

  static async updateTask(args) {
    const { userId, taskId, taskName, taskListId = '@default', ...updateData } = args;
    
    if (!taskId && !taskName) {
      throw new Error('Either taskId or taskName must be provided');
    }
    
    let finalTaskId = taskId;
    
    if (taskName) {
      // Find task by name first
      const tasks = await tasksService.getTasks(userId, taskListId);
      const matchingTask = tasks.find(task => 
        task.title && task.title.toLowerCase().includes(taskName.toLowerCase())
      );
      
      if (!matchingTask) {
        throw new Error(`No task found with name containing "${taskName}"`);
      }
      
      finalTaskId = matchingTask.id;
    }
    
    const taskData = {};
    if (updateData.title) taskData.title = updateData.title;
    if (updateData.notes) taskData.notes = updateData.notes;
    if (updateData.due) taskData.due = new Date(updateData.due).toISOString();
    if (updateData.status) taskData.status = updateData.status;

    return await tasksService.updateTask(userId, finalTaskId, taskData, taskListId);
  }

  static async deleteTask(args) {
    const { userId, taskId, taskName, taskListId = '@default' } = args;
    
    if (!taskId && !taskName) {
      throw new Error('Either taskId or taskName must be provided');
    }
    
    if (taskName) {
      // Find task by name first
      const tasks = await tasksService.getTasks(userId, taskListId);
      const matchingTask = tasks.find(task => 
        task.title && task.title.toLowerCase().includes(taskName.toLowerCase())
      );
      
      if (!matchingTask) {
        throw new Error(`No task found with name containing "${taskName}"`);
      }
      
      return await tasksService.deleteTask(userId, matchingTask.id, taskListId);
    } else {
      return await tasksService.deleteTask(userId, taskId, taskListId);
    }
  }

  static async completeTask(args) {
    const { userId, taskId, taskListId = '@default' } = args;
    return await tasksService.completeTask(userId, taskId, taskListId);
  }

  static async getTaskLists(args) {
    const { userId } = args;
    return await tasksService.getTaskLists(userId);
  }
}

module.exports = TaskTools;