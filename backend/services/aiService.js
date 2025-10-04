const dbService = require('./dbService');
const AuraFlowTools = require('../tools');

class AIService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL;
    this.apiKey = process.env.LLM_API_KEY;
    this.cachedModels = null;
    this.defaultModel = null;
    this.isHuggingFace = this.baseURL && this.baseURL.includes('huggingface.co');
    this.isMock = this.baseURL === 'mock' || this.baseURL === 'test';
    console.log('AIService initialized with:', { 
      baseURL: this.baseURL, 
      apiKey: this.apiKey ? 'SET' : 'NOT SET',
      isHuggingFace: this.isHuggingFace,
      isMock: this.isMock
    });
  }

  async getModels() {
    if (this.cachedModels) {
      return this.cachedModels;
    }
    
    if (this.isHuggingFace) {
      // For Hugging Face, we know the model from the URL
      const modelName = this.baseURL.split('/models/')[1] || 'huggingface-model';
      this.cachedModels = {
        data: [{ id: modelName, object: 'model' }]
      };
      return this.cachedModels;
    }
    
    const modelsUrl = this.baseURL.endsWith('/v1') ? `${this.baseURL}/models` : `${this.baseURL}/v1/models`;
    console.log('Fetching models from:', modelsUrl);
    const response = await fetch(modelsUrl, {
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
    
    // Cache a suitable chat model as default
    if (result.data && result.data.length > 0) {
      // Prefer llama models for chat
      const chatModel = result.data.find(model => 
        model.id.includes('llama') || 
        model.id.includes('mixtral') || 
        model.id.includes('gemma') ||
        model.id.includes('qwen')
      );
      this.defaultModel = chatModel ? chatModel.id : result.data[0].id;
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

  async sendMessage(message, model, userId = null, sessionId = null, skipHistory = false) {
    const executedTools = []; // Initialize at function start
    
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
1. BEFORE deleting tasks: ALWAYS call tasks_get_tasks first to see what tasks exist
2. BEFORE deleting calendar events: ALWAYS call calendar_get_events first to see what events exist
3. To DELETE a task: Use tasks_delete_task with taskName parameter (e.g., {"taskName": "Brush teeth"})
4. To DELETE a calendar event: Use calendar_delete_event with eventName parameter (e.g., {"eventName": "Watch stranger things"})
4. To DELETE a calendar event: Use calendar_delete_event with eventName parameter (e.g., {"eventName": "Watch stranger things"})
5. To UPDATE a task: First call tasks_get_tasks to get the task ID, then use tasks_update_task
6. To COMPLETE a task: First call tasks_get_tasks to get the task ID, then use tasks_complete_task
7. To UPDATE a calendar event: First call calendar_get_events to get the event ID, then use calendar_update_event
8. Never claim you've completed an action unless you actually called the appropriate tool
9. tasks_get_tasks only RETRIEVES tasks - it does NOT delete, update, or complete them
10. calendar_get_events only RETRIEVES events - it does NOT delete or update them

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

      let response;
      
      if (this.isMock) {
        // Mock AI responses for testing
        const mockResponses = [
          "Hello! I'm Aurora, your AI assistant. How can I help you today?",
          "I'm doing well, thank you for asking! What can I assist you with?",
          "That's an interesting question. Let me help you with that.",
          "I'm here to help with your tasks and calendar. What would you like to do?"
        ];
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        // Simulate API response format
        const mockData = {
          choices: [{
            message: {
              content: randomResponse,
              tool_calls: null
            }
          }]
        };
        
        return {
          response: randomResponse,
          executedTools
        };
      } else if (this.isHuggingFace) {
        // Hugging Face Inference API format
        const lastMessage = conversationMessages[conversationMessages.length - 1];
        const huggingFaceBody = {
          inputs: lastMessage.content,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            return_full_text: false
          }
        };
        
        console.log('🤗 Hugging Face API Request:');
        console.log('URL:', this.baseURL);
        console.log('Headers:', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...`
        });
        console.log('Body:', JSON.stringify(huggingFaceBody, null, 2));
        
        response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(huggingFaceBody)
        });
        
        console.log('🤗 Hugging Face Response Status:', response.status, response.statusText);
        console.log('🤗 Response Headers:', Object.fromEntries(response.headers.entries()));
      } else {
        const chatUrl = this.baseURL.endsWith('/v1') ? `${this.baseURL}/chat/completions` : `${this.baseURL}/v1/chat/completions`;
        response = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ancestry-IsInternal': 'true',
            'Ancestry-ClientPath': 'auraflow',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
      }

      let data;
      try {
        const responseText = await response.text();
        console.log('📝 Raw API response (first 500 chars):', responseText.substring(0, 500));
        console.log('📝 Response length:', responseText.length);
        
        if (responseText.trim() === 'Not Found') {
          throw new Error(`Model not found or not available: ${this.baseURL}`);
        }
        
        data = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON response');
      } catch (parseError) {
        console.error('❌ Failed to parse API response as JSON:', parseError.message);
        console.error('🔍 Response was likely not JSON format');
        throw new Error(`Invalid API response format: ${parseError.message}`);
      }
      
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(`API error: ${data.error?.message || response.statusText}`);
      }
      
      let aiMessage;
      let finalResponse;
      
      if (this.isHuggingFace) {
        // Hugging Face returns array of generated text
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
          let generatedText = data[0].generated_text.trim();
          
          // DialoGPT sometimes includes the input, so remove it
          const lastMessage = conversationMessages[conversationMessages.length - 1];
          if (generatedText.startsWith(lastMessage.content)) {
            generatedText = generatedText.substring(lastMessage.content.length).trim();
          }
          
          finalResponse = generatedText || "I'm here to help! What can I do for you?";
          aiMessage = { content: finalResponse, tool_calls: null };
        } else {
          console.error('Unexpected Hugging Face response structure:', data);
          throw new Error('Invalid Hugging Face response structure');
        }
      } else {
        // OpenAI-compatible format
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Unexpected API response structure:', data);
          throw new Error('Invalid API response structure');
        }
        aiMessage = data.choices[0].message;
        finalResponse = aiMessage.content;
      }

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
            let toolArgs;
            
            try {
              toolArgs = JSON.parse(toolCall.function.arguments);
            } catch (parseError) {
              console.error(`❌ TOOL ARGS PARSE ERROR: ${toolName}`, {
                user: userId,
                callId: toolCall.id,
                error: parseError.message,
                rawArgs: toolCall.function.arguments
              });
              
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify({ 
                  error: `Invalid tool arguments: ${parseError.message}`,
                  success: false
                })
              });
              continue;
            }
            
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
            
            // Track successful tool execution
            executedTools.push({
              tool: toolName,
              success: true,
              callId: toolCall.id,
              result: result
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
              stack: error.stack
            });
            
            // Track failed tool execution
            executedTools.push({
              tool: toolCall.function.name,
              success: false,
              callId: toolCall.id,
              error: error.message
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

        // Get final response with tool results - RECURSIVE TOOL HANDLING
        let currentMessages = [
          ...conversationMessages,
          aiMessage,
          ...toolResults
        ];
        
        let maxIterations = 5; // Prevent infinite loops
        let iteration = 0;
        
        while (iteration < maxIterations) {
          const followUpUrl = this.baseURL.endsWith('/v1') ? `${this.baseURL}/chat/completions` : `${this.baseURL}/v1/chat/completions`;
          const followUpResponse = await fetch(followUpUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ancestry-IsInternal': 'true',
              'Ancestry-ClientPath': 'auraflow',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model,
              messages: currentMessages,
              tools: userId && tools.length > 0 ? tools : undefined,
              tool_choice: userId && tools.length > 0 ? 'auto' : undefined
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
          
          const followUpMessage = followUpData.choices[0].message;
          
          // If no more tool calls, we're done
          if (!followUpMessage.tool_calls || followUpMessage.tool_calls.length === 0) {
            finalResponse = followUpMessage.content;
            console.log(`🤖 LLM FINAL RESPONSE (${userId}):`, finalResponse);
            console.log(`🔍 finalResponse type:`, typeof finalResponse);
            console.log(`🔍 finalResponse value:`, finalResponse);
            break;
          }
          
          // Execute more tool calls
          console.log(`🔄 ITERATION ${iteration + 1}: LLM wants to make ${followUpMessage.tool_calls.length} more tool calls`);
          
          const moreToolResults = [];
          for (const toolCall of followUpMessage.tool_calls) {
            try {
              const toolName = toolCall.function.name;
              let toolArgs;
              
              try {
                toolArgs = JSON.parse(toolCall.function.arguments);
              } catch (parseError) {
                console.error(`❌ TOOL ARGS PARSE ERROR: ${toolName}`, {
                  user: userId,
                  callId: toolCall.id,
                  error: parseError.message,
                  rawArgs: toolCall.function.arguments
                });
                
                moreToolResults.push({
                  tool_call_id: toolCall.id,
                  role: 'tool',
                  content: JSON.stringify({ 
                    error: `Invalid tool arguments: ${parseError.message}`,
                    success: false
                  })
                });
                continue;
              }
              
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
              
              executedTools.push({
                tool: toolName,
                success: true,
                callId: toolCall.id,
                result: result
              });
              
              moreToolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify(result)
              });
            } catch (error) {
              console.error(`❌ TOOL ERROR: ${toolCall.function.name}`, {
                user: userId,
                callId: toolCall.id,
                error: error.message,
                stack: error.stack
              });
              
              executedTools.push({
                tool: toolCall.function.name,
                success: false,
                callId: toolCall.id,
                error: error.message
              });
              
              moreToolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify({ 
                  error: this.formatToolError(error),
                  success: false
                })
              });
            }
          }
          
          // Add this round of messages to the conversation
          currentMessages.push(followUpMessage);
          currentMessages.push(...moreToolResults);
          
          iteration++;
        }
        
        if (iteration >= maxIterations) {
          console.warn(`⚠️  Hit max iterations (${maxIterations}) for tool calls`);
          finalResponse = "I've completed several steps but reached the maximum number of operations. Please check the results.";
        }
      } else {
        console.log(`🤖 LLM RESPONSE (${userId}):`, finalResponse);
      }

      // Save chat message to database if user is authenticated and not skipping history
      if (userId && !skipHistory) {
        try {
          const messageContent = typeof finalResponse === 'string' 
            ? finalResponse 
            : finalResponse?.message || finalResponse?.content || 'No response content';
          
          await dbService.saveChatMessage(userId, message, messageContent, model, sessionId);
        } catch (dbError) {
          console.error('Failed to save chat message:', dbError);
          // Don't fail the AI response if database save fails
        }
      }

      console.log(`🔍 About to return finalResponse:`, typeof finalResponse, finalResponse);
      return finalResponse;
    } catch (error) {
      console.error('LiteLLM API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
