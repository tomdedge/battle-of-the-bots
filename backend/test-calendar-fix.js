const CalendarTools = require('./tools/calendarTools');

// Test the new schema format
const testArgs = {
  userId: "jonathansirrine@gmail.com",
  summary: "Go running",
  start: { dateTime: "2025-10-03T17:30:00Z" },
  end: { dateTime: "2025-10-03T18:00:00Z" }
};

console.log('Testing new calendar tool format...');
console.log('Input args:', JSON.stringify(testArgs, null, 2));

// Test tool definition
const toolDefs = CalendarTools.getToolDefinitions();
const createEventTool = toolDefs.find(t => t.name === 'calendar_create_event');
console.log('\nTool schema required fields:', createEventTool.inputSchema.required);
console.log('Tool schema properties:', Object.keys(createEventTool.inputSchema.properties));

// Validate args against schema
const hasAllRequired = createEventTool.inputSchema.required.every(field => {
  if (field === 'start' || field === 'end') {
    return testArgs[field] && testArgs[field].dateTime;
  }
  return testArgs[field] !== undefined;
});

console.log('\nValidation result:', hasAllRequired ? 'PASS' : 'FAIL');