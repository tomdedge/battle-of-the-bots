const { google } = require('googleapis');
const dbService = require('./dbService');

class TasksService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getAuthenticatedClient(userId) {
    try {
      const user = await dbService.getUserById(userId);
      if (!user || !user.access_token) {
        console.error('User not authenticated or missing tokens:', { userId, hasUser: !!user, hasToken: !!(user?.access_token) });
        throw new Error('User not authenticated with Google. Please sign out and sign back in to refresh your Google authentication tokens.');
      }
      
      this.oauth2Client.setCredentials({
        access_token: user.access_token,
        refresh_token: user.refresh_token
      });

      // Try to refresh the token if it's expired
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        if (credentials.access_token !== user.access_token) {
          // Update the database with new tokens
          await dbService.updateUserTokens(userId, {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || user.refresh_token
          });
          console.log('Refreshed access token for user:', userId);
        }
      } catch (refreshError) {
        console.log('Token refresh failed (may not be expired):', refreshError.message);
        if (refreshError.message.includes('No refresh token')) {
          throw new Error('Google authentication tokens have expired and cannot be refreshed. Please sign out and sign back in to re-authenticate with Google.');
        }
      }
      
      return google.tasks({ version: 'v1', auth: this.oauth2Client });
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      throw error;
    }
  }

  async getTaskLists(userId) {
    const tasks = await this.getAuthenticatedClient(userId);
    const response = await tasks.tasklists.list();
    return response.data.items || [];
  }

  async getTasks(userId, taskListId = '@default') {
    const tasks = await this.getAuthenticatedClient(userId);
    const response = await tasks.tasks.list({
      tasklist: taskListId,
      showCompleted: true,
      showHidden: true
    });
    return response.data.items || [];
  }

  async createTask(userId, taskData, taskListId = '@default') {
    const tasks = await this.getAuthenticatedClient(userId);
    const response = await tasks.tasks.insert({
      tasklist: taskListId,
      resource: taskData
    });
    return response.data;
  }

  async updateTask(userId, taskId, taskData, taskListId = '@default') {
    try {
      const tasks = await this.getAuthenticatedClient(userId);
      
      // First, get the existing task to preserve its data
      console.log('Getting existing task:', { taskId, taskListId });
      let existingTask;
      try {
        const response = await tasks.tasks.get({
          tasklist: taskListId,
          task: taskId
        });
        existingTask = response;
      } catch (getError) {
        if (getError.code === 404 || getError.message.includes('Invalid task ID')) {
          throw new Error(`Task with ID "${taskId}" not found or invalid. To update a task, you must first call tasks_get_tasks to get the current list of tasks and their valid IDs, then use the exact task ID from that response.`);
        }
        throw getError;
      }
      
      console.log('Task found:', existingTask.data.title);
      
      // Merge new data with existing task data
      const updateData = {
        ...existingTask.data,
        ...taskData,
        id: taskId
      };
      
      console.log('Updating with merged data:', { title: updateData.title, status: updateData.status });
      const response = await tasks.tasks.update({
        tasklist: taskListId,
        task: taskId,
        resource: updateData
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateTask:', error.message);
      throw error;
    }
  }

  async deleteTask(userId, taskId, taskListId = '@default') {
    try {
      const tasks = await this.getAuthenticatedClient(userId);
      
      // First verify the task exists
      try {
        await tasks.tasks.get({
          tasklist: taskListId,
          task: taskId
        });
      } catch (getError) {
        if (getError.code === 404 || getError.message.includes('Invalid task ID')) {
          throw new Error(`Task with ID "${taskId}" not found or invalid. To delete a task, you must first call tasks_get_tasks to get the current list of tasks and their valid IDs, then use the exact task ID from that response.`);
        }
        throw getError;
      }
      
      await tasks.tasks.delete({
        tasklist: taskListId,
        task: taskId
      });
      
      return { success: true, taskId };
    } catch (error) {
      console.error('Error deleting task:', error.message);
      throw error;
    }
  }

  async updateTaskByName(userId, taskName, taskData, taskListId = '@default') {
    try {
      // First, get all tasks to find the one with matching name
      const allTasks = await this.getTasks(userId, taskListId);
      const targetTask = allTasks.find(task => 
        task.title && task.title.toLowerCase() === taskName.toLowerCase()
      );
      
      if (!targetTask) {
        throw new Error(`Task with name "${taskName}" not found`);
      }
      
      // Update the task using its ID
      return await this.updateTask(userId, targetTask.id, taskData, taskListId);
    } catch (error) {
      console.error('Error in updateTaskByName:', error.message);
      throw error;
    }
  }

  async completeTask(userId, taskId, taskListId = '@default') {
    try {
      console.log('Completing task:', { userId, taskId, taskListId });
      return this.updateTask(userId, taskId, { 
        status: 'completed',
        completed: new Date().toISOString()
      }, taskListId);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }
}

module.exports = new TasksService();
