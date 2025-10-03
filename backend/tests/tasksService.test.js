const tasksService = require('../services/tasksService');

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn()
      }))
    },
    tasks: jest.fn(() => ({
      tasklists: {
        list: jest.fn()
      },
      tasks: {
        list: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    }))
  }
}));

// Mock dbService
jest.mock('../services/dbService', () => ({
  getUserById: jest.fn()
}));

const { google } = require('googleapis');
const dbService = require('../services/dbService');

describe('TasksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthenticatedClient', () => {
    it('should return authenticated tasks client', async () => {
      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockTasks = { tasklists: { list: jest.fn() } };
      google.tasks.mockReturnValueOnce(mockTasks);

      const result = await tasksService.getAuthenticatedClient(1);

      expect(dbService.getUserById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockTasks);
    });

    it('should throw error if user not authenticated', async () => {
      dbService.getUserById.mockResolvedValueOnce(null);

      await expect(tasksService.getAuthenticatedClient(1))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('getTaskLists', () => {
    it('should return task lists', async () => {
      const mockTaskLists = [
        { id: 'list1', title: 'My Tasks' }
      ];

      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockTasks = {
        tasklists: {
          list: jest.fn().mockResolvedValueOnce({
            data: { items: mockTaskLists }
          })
        }
      };

      google.tasks.mockReturnValueOnce(mockTasks);

      const result = await tasksService.getTaskLists(1);

      expect(mockTasks.tasklists.list).toHaveBeenCalled();
      expect(result).toEqual(mockTaskLists);
    });
  });

  describe('getTasks', () => {
    it('should return tasks from default list', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Test Task' }
      ];

      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockTasksClient = {
        tasks: {
          list: jest.fn().mockResolvedValueOnce({
            data: { items: mockTasks }
          })
        }
      };

      google.tasks.mockReturnValueOnce(mockTasksClient);

      const result = await tasksService.getTasks(1);

      expect(mockTasksClient.tasks.list).toHaveBeenCalledWith({
        tasklist: '@default',
        showCompleted: true,
        showHidden: true
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return tasks from specific list', async () => {
      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockTasksClient = {
        tasks: {
          list: jest.fn().mockResolvedValueOnce({
            data: { items: [] }
          })
        }
      };

      google.tasks.mockReturnValueOnce(mockTasksClient);

      await tasksService.getTasks(1, 'custom-list');

      expect(mockTasksClient.tasks.list).toHaveBeenCalledWith({
        tasklist: 'custom-list',
        showCompleted: true,
        showHidden: true
      });
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        id: 'new-task',
        title: 'New Task'
      };

      const mockUser = {
        id: 1,
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      dbService.getUserById.mockResolvedValueOnce(mockUser);

      const mockTasksClient = {
        tasks: {
          insert: jest.fn().mockResolvedValueOnce({
            data: mockTask
          })
        }
      };

      google.tasks.mockReturnValueOnce(mockTasksClient);

      const taskData = { title: 'New Task' };
      const result = await tasksService.createTask(1, taskData);

      expect(mockTasksClient.tasks.insert).toHaveBeenCalledWith({
        tasklist: '@default',
        resource: taskData
      });
      expect(result).toEqual(mockTask);
    });
  });
});
