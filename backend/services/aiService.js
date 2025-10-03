const dbService = require('./dbService');
const AuraFlowTools = require('../tools');

class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
    this.cachedModels = null;
    this.defaultModel = null;
    console.log('AIService initialized with:', { baseURL: this.baseURL, apiKey: this.apiKey ? 'SET' : 'NOT SET' });
  }

  async getModels() {
    if (this.cachedModels) {
      return this.cachedModels;
    }
    
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
    
    const result = await response.json();
    this.cachedModels = result;
    
    // Cache the first available model as default
    if (result.data && result.data.length > 0) {
      this.defaultModel = result.data[0].id;
    }
    
    return result;
  }

  getDefaultModel() {
    return this.defaultModel;
  }

  formatToolError(error) {
    const message = error.message || 'Unknown error occurred';
    
    // Handle authentication errors specially
    if (message.includes('Google authentication tokens have expired') || 
        message.includes('User not authenticated')) {
      return 'Authentication Error: Your Google account connection has expired. Please tell the user to sign out and sign back in to refresh their Google authentication. Until then, Google Calendar and Tasks features will not work.';
    }
    
    // Handle invalid ID errors
    if (message.includes('not found or invalid') && message.includes('call tasks_get_tasks')) {
      return message; // Already has helpful instructions
    }
    
    if (message.includes('not found') && message.includes('call calendar_get_events')) {
      return message; // Already has helpful instructions
    }
    
    // Generic error
    return `Tool Error: ${message}`;
  }

  async sendMessage(message, model, userId = null, sessionId = null) {
    if (!model) {
      model = this.getDefaultModel();
      if (!model) {
        // Try to get models if we don't have a cached default
        await this.getModels();
        model = this.getDefaultModel();
        if (!model) {
          throw new Error('No models available');
        }
      }
    }

    console.log(`💬 USER MESSAGE (${userId}):`, message);

    try {
      // Get user context for personalized system prompt
      let systemContent = 'You are Aurora, a mindful productivity assistant. Keep responses concise and helpful.';
      
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

IMPORTANT WORKFLOW RULES:
1. To DELETE a task: Use tasks_delete_task with taskName parameter (e.g., {"taskName": "Brush teeth"})
2. To DELETE a calendar event: Use calendar_delete_event with eventName parameter (e.g., {"eventName": "Watch stranger things"})
3. To UPDATE a task: First call tasks_get_tasks to get the task ID, then use tasks_update_task
4. To COMPLETE a task: First call tasks_get_tasks to get the task ID, then use tasks_complete_task
5. To UPDATE a calendar event: First call calendar_get_events to get the event ID, then use calendar_update_event
6. Never claim you've completed an action unless you actually called the appropriate tool
7. tasks_get_tasks only RETRIEVES tasks - it does NOT delete, update, or complete them
8. calendar_get_events only RETRIEVES events - it does NOT delete or update them

Keep responses concise, helpful, and personalized. Use their name when appropriate.`;
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

      console.log(`🛠️  AVAILABLE TOOLS (${tools.length}):`, tools.map(t => t.function.name));
      
      // Check if delete tools are included
      const hasDeleteTask = tools.some(t => t.function.name === 'tasks_delete_task');
      const hasDeleteEvent = tools.some(t => t.function.name === 'calendar_delete_event');
      
      console.log(`🗑️  tasks_delete_task included:`, hasDeleteTask);
      console.log(`🗑️  calendar_delete_event included:`, hasDeleteEvent);
      
      if (hasDeleteTask) {
        const deleteTaskTool = tools.find(t => t.function.name === 'tasks_delete_task');
        console.log(`🗑️  tasks_delete_task definition:`, JSON.stringify(deleteTaskTool, null, 2));
      }
      
      if (hasDeleteEvent) {
        const deleteEventTool = tools.find(t => t.function.name === 'calendar_delete_event');
        console.log(`🗑️  calendar_delete_event definition:`, JSON.stringify(deleteEventTool, null, 2));
      }

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
      
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(`API error: ${data.error?.message || response.statusText}`);
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }
      
      const aiMessage = data.choices[0].message;

      let finalResponse = aiMessage.content;

      // Handle tool calls
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        console.log(`🤖 LLM INTENDED TOOL CALLS (${aiMessage.tool_calls.length}):`, 
          aiMessage.tool_calls.map(tc => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments),
            id: tc.id
          }))
        );
        
        const toolResults = [];
        
        for (const toolCall of aiMessage.tool_calls) {
          try {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            
            // Add userId to tool arguments
            toolArgs.userId = userId;
            
            console.log(`🔧 TOOL CALL: ${toolName}`, {
              user: userId,
              args: toolArgs,
              callId: toolCall.id
            });
            
            const startTime = Date.now();
            const result = await AuraFlowTools.executeTool(toolName, toolArgs);
            const duration = Date.now() - startTime;
            
            console.log(`✅ TOOL SUCCESS: ${toolName} (${duration}ms)`, {
              user: userId,
              callId: toolCall.id,
              result: typeof result === 'object' ? JSON.stringify(result).substring(0, 200) + '...' : result
            });
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(result)
            });
          } catch (error) {
            console.error(`❌ TOOL ERROR: ${toolCall.function.name}`, {
              user: userId,
              callId: toolCall.id,
              error: error.message,
              args: JSON.parse(toolCall.function.arguments)
            });
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ 
                error: this.formatToolError(error),
                success: false
              })
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
        
        if (!followUpResponse.ok) {
          console.error('Follow-up API error response:', followUpData);
          throw new Error(`Follow-up API error: ${followUpData.error?.message || followUpResponse.statusText}`);
        }
        
        if (!followUpData.choices || !followUpData.choices[0] || !followUpData.choices[0].message) {
          console.error('Unexpected follow-up API response structure:', followUpData);
          throw new Error('Invalid follow-up API response structure');
        }
        
        finalResponse = followUpData.choices[0].message.content;
        console.log(`🤖 LLM FINAL RESPONSE (${userId}):`, finalResponse);
      } else {
        console.log(`🤖 LLM RESPONSE (${userId}):`, finalResponse);
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
