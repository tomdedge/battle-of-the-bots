class ApiService {
  constructor(token) {
    this.token = token;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  }

  async clearChatHistory() {
    const response = await fetch(`${this.baseURL}/auth/chat/history`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async deleteChatMessage(messageId) {
    const response = await fetch(`${this.baseURL}/auth/chat/message/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async getCalendarEvents(start, end) {
    const response = await fetch(`${this.baseURL}/api/calendar/events?start=${start}&end=${end}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async analyzeCalendar(date) {
    const response = await fetch(`${this.baseURL}/api/calendar/analyze?date=${date}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async createFocusBlock(focusBlock) {
    const response = await fetch(`${this.baseURL}/api/calendar/focus-block`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(focusBlock)
    });
    return response.json();
  }

  async getTaskLists() {
    const response = await fetch(`${this.baseURL}/api/tasks/lists`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async getTasks(listId) {
    const url = listId ? `${this.baseURL}/api/tasks?listId=${listId}` : `${this.baseURL}/api/tasks`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async createTask(taskData, listId) {
    const url = listId ? `${this.baseURL}/api/tasks?listId=${listId}` : `${this.baseURL}/api/tasks`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    return response.json();
  }

  async updateTask(taskId, taskData, listId) {
    const url = listId ? `${this.baseURL}/api/tasks/${taskId}?listId=${listId}` : `${this.baseURL}/api/tasks/${taskId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    return response.json();
  }

  async completeTask(taskId, listId) {
    const url = listId ? `${this.baseURL}/api/tasks/${taskId}/complete?listId=${listId}` : `${this.baseURL}/api/tasks/${taskId}/complete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async getUserAvatar(userId) {
    const response = await fetch(`${this.baseURL}/api/user/avatar/${userId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (response.ok) {
      return response.blob();
    }
    throw new Error('Avatar not found');
  }
}

export default ApiService;