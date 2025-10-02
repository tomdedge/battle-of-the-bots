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
        throw new Error('User not authenticated');
      }
      
      this.oauth2Client.setCredentials({
        access_token: user.access_token,
        refresh_token: user.refresh_token
      });
      
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
      const existingTask = await tasks.tasks.get({
        tasklist: taskListId,
        task: taskId
      });
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
    const tasks = await this.getAuthenticatedClient(userId);
    await tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId
    });
    return { success: true };
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
