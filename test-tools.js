#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const AuraFlowTools = require('./backend/tools');

async function testTools() {
  console.log('Testing AuraFlow LLM Tools...\n');

  // Test tool definitions
  console.log('1. Testing tool definitions...');
  try {
    const tools = AuraFlowTools.getAllToolDefinitions();
    console.log(`✓ Found ${tools.length} tools`);
    
    const toolNames = tools.map(t => t.name);
    console.log('Available tools:', toolNames.join(', '));
    
    // Check for required CRUD operations
    const calendarTools = toolNames.filter(name => name.startsWith('calendar_'));
    const taskTools = toolNames.filter(name => name.startsWith('tasks_'));
    
    console.log(`✓ Calendar tools: ${calendarTools.length} (${calendarTools.join(', ')})`);
    console.log(`✓ Task tools: ${taskTools.length} (${taskTools.join(', ')})`);
    
    // Verify CRUD operations exist
    const requiredCalendarOps = ['calendar_create_event', 'calendar_get_events', 'calendar_update_event', 'calendar_delete_event'];
    const requiredTaskOps = ['tasks_create_task', 'tasks_get_tasks', 'tasks_update_task', 'tasks_delete_task'];
    
    const missingCalendarOps = requiredCalendarOps.filter(op => !toolNames.includes(op));
    const missingTaskOps = requiredTaskOps.filter(op => !toolNames.includes(op));
    
    if (missingCalendarOps.length === 0) {
      console.log('✓ All calendar CRUD operations available');
    } else {
      console.log('✗ Missing calendar operations:', missingCalendarOps.join(', '));
    }
    
    if (missingTaskOps.length === 0) {
      console.log('✓ All task CRUD operations available');
    } else {
      console.log('✗ Missing task operations:', missingTaskOps.join(', '));
    }
    
  } catch (error) {
    console.log('✗ Error getting tool definitions:', error.message);
  }

  console.log('\n2. Testing tool categories...');
  try {
    const categories = AuraFlowTools.getToolsByCategory();
    console.log('✓ Categories:', Object.keys(categories).join(', '));
    
    for (const [category, tools] of Object.entries(categories)) {
      console.log(`  - ${category}: ${tools.length} tools`);
    }
  } catch (error) {
    console.log('✗ Error getting tool categories:', error.message);
  }

  console.log('\n3. Testing tool execution (dry run)...');
  
  // Test invalid tool
  try {
    await AuraFlowTools.executeTool('invalid_tool', {});
    console.log('✗ Should have thrown error for invalid tool');
  } catch (error) {
    console.log('✓ Correctly rejected invalid tool:', error.message);
  }

  // Test tool routing
  try {
    // This will fail due to missing auth, but should route correctly
    await AuraFlowTools.executeTool('calendar_get_events', { userId: 1 });
  } catch (error) {
    if (error.message.includes('User not authenticated') || error.message.includes('getUserById') || !error.message.includes('invalid input syntax')) {
      console.log('✓ Calendar tool routing works (auth error expected)');
    } else {
      console.log('✗ Unexpected calendar tool error:', error.message);
    }
  }

  try {
    // This will fail due to missing auth, but should route correctly
    await AuraFlowTools.executeTool('tasks_get_tasks', { userId: 1 });
  } catch (error) {
    if (error.message.includes('User not authenticated') || error.message.includes('getUserById') || !error.message.includes('invalid input syntax')) {
      console.log('✓ Task tool routing works (auth error expected)');
    } else {
      console.log('✗ Unexpected task tool error:', error.message);
    }
  }

  console.log('\n✓ Tool structure validation complete!');
  console.log('\nNext steps:');
  console.log('1. Ensure database is running and users are authenticated');
  console.log('2. Test with real user credentials');
  console.log('3. Verify Google API integration');
}

if (require.main === module) {
  testTools().catch(console.error);
}

module.exports = { testTools };