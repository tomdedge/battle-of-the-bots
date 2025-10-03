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

  async deleteMessage(messageId) {
    const response = await fetch(`${this.baseURL}/auth/messages/${messageId}`, {
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

  async analyzeCalendar(date, days = 1) {
    const url = `${this.baseURL}/api/calendar/analyze?date=${date}&days=${days}`;
    
    // Generate cache key
    const cacheKey = `suggestions_${date}_${days}_${this.token?.slice(-8) || 'anon'}`;
    
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
      
      if (!isExpired) {
        console.log('Using cached suggestions for:', date, days);
        return data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
    
    console.log('Making analyze request to:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    if (!response.ok) {
      console.error('Analyze calendar failed:', response.status, response.statusText);
      throw new Error(`Failed to analyze calendar: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Analyze calendar result:', result);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));
    
    return result;
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
    
    // Clear suggestion cache when calendar is modified
    this.clearSuggestionCache();
    
    return response.json();
  }

  async updateEvent(eventId, eventData) {
    const response = await fetch(`${this.baseURL}/api/calendar/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    this.clearSuggestionCache();
    return response.json();
  }

  async deleteEvent(eventId) {
    const response = await fetch(`${this.baseURL}/api/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    this.clearSuggestionCache();
    return response.json();
  }

  clearSuggestionCache() {
    // Clear all suggestion cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('suggestions_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared suggestion cache');
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

  async deleteTask(taskId, listId) {
    const url = listId ? `${this.baseURL}/api/tasks/${taskId}?listId=${listId}` : `${this.baseURL}/api/tasks/${taskId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
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