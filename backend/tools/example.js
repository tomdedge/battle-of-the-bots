const AuraFlowTools = require('./index');

// Example usage of the LLM tools
async function demonstrateTools() {
  console.log('Available Tools:');
  console.log('================');
  
  const tools = AuraFlowTools.getAllToolDefinitions();
  tools.forEach(tool => {
    console.log(`\n${tool.name}:`);
    console.log(`  Description: ${tool.description}`);
    console.log(`  Required params: ${tool.inputSchema.required.join(', ')}`);
  });

  console.log('\n\nTools by Category:');
  console.log('==================');
  
  const categories = AuraFlowTools.getToolsByCategory();
  Object.entries(categories).forEach(([category, categoryTools]) => {
    console.log(`\n${category.toUpperCase()}:`);
    categoryTools.forEach(tool => {
      console.log(`  - ${tool.name}`);
    });
  });

  // Example tool execution (would need actual user authentication in practice)
  console.log('\n\nExample Tool Execution:');
  console.log('=======================');
  console.log('// Create a task');
  console.log('await AuraFlowTools.executeTool("tasks_create_task", {');
  console.log('  userId: "user123",');
  console.log('  title: "Review LLM tools implementation",');
  console.log('  notes: "Test the new CRUD operations for calendar and tasks"');
  console.log('});');
  
  console.log('\n// Get calendar events');
  console.log('await AuraFlowTools.executeTool("calendar_get_events", {');
  console.log('  userId: "user123",');
  console.log('  startDate: "2025-10-02T00:00:00Z",');
  console.log('  endDate: "2025-10-03T00:00:00Z"');
  console.log('});');
}

if (require.main === module) {
  demonstrateTools().catch(console.error);
}

module.exports = { demonstrateTools };