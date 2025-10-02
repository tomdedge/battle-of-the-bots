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
}

export default ApiService;