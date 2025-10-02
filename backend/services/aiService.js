const dbService = require('./dbService');

class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
    console.log('AIService initialized with:', { baseURL: this.baseURL, apiKey: this.apiKey ? 'SET' : 'NOT SET' });
  }

  async getModels() {
    console.log('Fetching models from:', `${this.baseURL}/v1/models`);
    const response = await fetch(`${this.baseURL}/v1/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      // Accept self-signed certificates for internal services
      agent: process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    });
    return response.json();
  }

  async sendMessage(message, model = 'gpt-4o-mini', userId = null, sessionId = null) {
    try {
      // Enhanced system prompt with user context
      const systemContent = userId 
        ? `You are AuraFlow, a mindful productivity assistant for user ${userId}. Keep responses concise and helpful. You have access to their calendar and tasks.`
        : 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.';

      // Temporarily disable TLS verification for internal services
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ancestry-IsInternal': 'true',
          'Ancestry-ClientPath': 'auraflow',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemContent
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save chat message to database if user is authenticated
      if (userId) {
        try {
          await dbService.saveChatMessage(userId, message, aiResponse, model, sessionId);
        } catch (dbError) {
          console.error('Failed to save chat message:', dbError);
          // Don't fail the AI response if database save fails
        }
      }

      return aiResponse;
    } catch (error) {
      console.error('LiteLLM API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
