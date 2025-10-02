const dbService = require('./dbService');
const AuraFlowTools = require('../tools');

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
      // Get user context for personalized system prompt
      let systemContent = 'You are AuraFlow, a mindful productivity assistant. Keep responses concise and helpful.';
      
      if (userId) {
        console.log('Looking up user with ID:', userId);
        const user = await dbService.getUserById(userId);
        console.log('Found user:', user);
        
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const currentTime = new Date().toLocaleString('en-US', { 
          timeZone: userTimezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        systemContent = `You are AuraFlow, a mindful productivity assistant for ${user?.name || 'the user'}.

User Context:
- Name: ${user?.name || 'Unknown'}
- Email: ${user?.email || 'Unknown'}
- Current time: ${currentTime}
- You have access to their Google Calendar and Google Tasks via function calls

Available Functions:
- calendar_create_event: Create calendar events
- calendar_get_events: Get calendar events
- calendar_update_event: Update calendar events
- calendar_delete_event: Delete calendar events
- tasks_create_task: Create tasks
- tasks_get_tasks: Get tasks
- tasks_update_task: Update tasks
- tasks_delete_task: Delete tasks
- tasks_complete_task: Complete tasks
- tasks_get_task_lists: Get task lists

Keep responses concise, helpful, and personalized. Use their name when appropriate. When creating events or tasks, use the available functions.`;
      }

      // Get conversation history
      const conversationMessages = [
        {
          role: 'system',
          content: systemContent
        }
      ];

      if (userId) {
        // Get recent chat history (last 10 exchanges)
        const chatHistory = await dbService.getChatHistory(userId, 10);
        
        // Convert chat history to message format
        for (const chat of chatHistory) {
          conversationMessages.push({
            role: 'user',
            content: chat.message
          });
          
          if (chat.response) {
            conversationMessages.push({
              role: 'assistant',
              content: chat.response
            });
          }
        }
      }

      // Add current message
      conversationMessages.push({
        role: 'user',
        content: message
      });

      // Get available tools
      const tools = AuraFlowTools.getAllToolDefinitions().map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));

      // Temporarily disable TLS verification for internal services
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      const requestBody = {
        model,
        messages: conversationMessages
      };

      // Add tools if user is authenticated
      if (userId && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ancestry-IsInternal': 'true',
          'Ancestry-ClientPath': 'auraflow',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const aiMessage = data.choices[0].message;

      let finalResponse = aiMessage.content;

      // Handle tool calls
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        const toolResults = [];
        
        for (const toolCall of aiMessage.tool_calls) {
          try {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            
            // Add userId to tool arguments
            toolArgs.userId = userId;
            
            console.log(`Executing tool: ${toolName}`, toolArgs);
            const result = await AuraFlowTools.executeTool(toolName, toolArgs);
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(result)
            });
          } catch (error) {
            console.error(`Tool execution error for ${toolCall.function.name}:`, error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ error: error.message })
            });
          }
        }

        // Get final response with tool results
        const followUpResponse = await fetch(`${this.baseURL}/v1/chat/completions`, {
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
              ...conversationMessages,
              aiMessage,
              ...toolResults
            ]
          })
        });

        const followUpData = await followUpResponse.json();
        finalResponse = followUpData.choices[0].message.content;
      }

      // Save chat message to database if user is authenticated
      if (userId) {
        try {
          await dbService.saveChatMessage(userId, message, finalResponse, model, sessionId);
        } catch (dbError) {
          console.error('Failed to save chat message:', dbError);
          // Don't fail the AI response if database save fails
        }
      }

      return finalResponse;
    } catch (error) {
      console.error('LiteLLM API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
