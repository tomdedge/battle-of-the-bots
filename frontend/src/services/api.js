class ApiService {
  constructor(token) {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Calendar methods
  async getCalendarEvents(start, end) {
    return this.request(`/api/calendar/events?start=${start}&end=${end}`);
  }

  async analyzeCalendar(date) {
    return this.request(`/api/calendar/analyze?date=${date}`);
  }

  async createFocusBlock(focusBlockData) {
    return this.request('/api/calendar/focus-block', {
      method: 'POST',
      body: JSON.stringify(focusBlockData),
    });
  }

  // Tasks methods
  async getTaskLists() {
    return this.request('/api/tasks/lists');
  }

  async getTasks(listId = '@default') {
    return this.request(`/api/tasks?listId=${listId}`);
  }

  async createTask(taskData, listId = '@default') {
    return this.request(`/api/tasks?listId=${listId}`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId, taskData, listId = '@default') {
    return this.request(`/api/tasks/${taskId}?listId=${listId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId, listId = '@default') {
    return this.request(`/api/tasks/${taskId}?listId=${listId}`, {
      method: 'DELETE',
    });
  }

  async completeTask(taskId, listId = '@default') {
    return this.request(`/api/tasks/${taskId}/complete?listId=${listId}`, {
      method: 'POST',
    });
  }
}

export default ApiService;