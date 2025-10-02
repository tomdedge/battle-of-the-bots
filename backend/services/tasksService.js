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
    const user = await dbService.getUserById(userId);
    if (!user || !user.access_token) {
      throw new Error('User not authenticated');
    }
    
    this.oauth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token
    });
    
    return google.tasks({ version: 'v1', auth: this.oauth2Client });
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
    const tasks = await this.getAuthenticatedClient(userId);
    const response = await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      resource: taskData
    });
    return response.data;
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
    return this.updateTask(userId, taskId, { 
      status: 'completed',
      completed: new Date().toISOString()
    }, taskListId);
  }
}

module.exports = new TasksService();
