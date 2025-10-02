# AuraFlow LLM Tools

This directory contains tools that enable LLMs to perform CRUD operations on calendar events and tasks within the AuraFlow application.

## Overview

The tools are designed to provide a standardized interface for LLMs to interact with:
- Google Calendar events
- Google Tasks

## Architecture

```
tools/
├── index.js          # Main tools registry
├── calendarTools.js  # Calendar CRUD operations
├── taskTools.js      # Task CRUD operations
├── example.js        # Usage examples
└── README.md         # This file
```

## Available Tools

### Calendar Tools

- **calendar_create_event**: Create a new calendar event
- **calendar_get_events**: Retrieve events within a date range
- **calendar_update_event**: Update an existing event
- **calendar_delete_event**: Delete an event

### Task Tools

- **tasks_create_task**: Create a new task
- **tasks_get_tasks**: Retrieve tasks from a task list
- **tasks_update_task**: Update an existing task
- **tasks_delete_task**: Delete a task
- **tasks_complete_task**: Mark a task as completed
- **tasks_get_task_lists**: Get all task lists for a user

## API Endpoints

The tools are exposed via REST API endpoints:

- `GET /api/tools/definitions` - Get all tool definitions
- `GET /api/tools/categories` - Get tools organized by category
- `POST /api/tools/execute` - Execute a specific tool

## Usage Example

```javascript
// Get tool definitions
const response = await fetch('/api/tools/definitions');
const { tools } = await response.json();

// Execute a tool
const result = await fetch('/api/tools/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toolName: 'tasks_create_task',
    args: {
      title: 'Review code',
      notes: 'Check the new LLM tools implementation'
    }
  })
});
```

## Tool Schema

Each tool follows this schema:

```javascript
{
  name: 'tool_name',
  description: 'What the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      // Parameter definitions
    },
    required: ['required_params']
  }
}
```

## Authentication

All tools require user authentication. The `userId` is automatically injected from the authenticated user's session when tools are executed via the API endpoints.

## Error Handling

Tools return standardized error responses:

```javascript
{
  error: 'Error message describing what went wrong'
}
```

## Integration with Google APIs

The tools integrate with:
- Google Calendar API v3
- Google Tasks API v1

User authentication tokens are managed by the existing authentication system and automatically used by the tools.