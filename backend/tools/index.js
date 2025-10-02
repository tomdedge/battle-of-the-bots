const CalendarTools = require('./calendarTools');
const TaskTools = require('./taskTools');

class AuraFlowTools {
  static getAllToolDefinitions() {
    return [
      ...CalendarTools.getToolDefinitions(),
      ...TaskTools.getToolDefinitions()
    ];
  }

  static async executeTool(toolName, args) {
    // Route to appropriate tool handler
    if (toolName.startsWith('calendar_')) {
      return await CalendarTools.executeTool(toolName, args);
    } else if (toolName.startsWith('tasks_')) {
      return await TaskTools.executeTool(toolName, args);
    } else {
      throw new Error(`Unknown tool category for: ${toolName}`);
    }
  }

  static getToolsByCategory() {
    return {
      calendar: CalendarTools.getToolDefinitions(),
      tasks: TaskTools.getToolDefinitions()
    };
  }
}

module.exports = AuraFlowTools;