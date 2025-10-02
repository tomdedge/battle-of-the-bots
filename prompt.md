# AuraFlow

## Your task

Write a more detailed plan.md
given the base project overview and details below

## Overview

A Mindful Flow Assistant designed to help individuals maintain consistent focus and build positive digital habits in an increasingly distracted world. The application addresses the common struggle of managing attention and productivity without the guilt and overwhelm typical of traditional productivity tools.

## Initial Features
- Google Sign In
- AI Chat interface
	- Message interface to talk to AI that has access to tools for google calendar/tasks AI
- Calendar Display
	- onload
		- AI reviews calendar and suggests focus blocks to schedule. User needs to take action to actually schedule those blocks.
	- prompt chat
		- ai has tools to organize/modify/edit/create on the calendar according to user prompts.
- Box breathing interface (Use html5 canvas and create.js)

## Tech

### Backend
Express + Socket.io backend
Fetch call to LiteLLM endpoint
```
const response = await fetch(`${LLM_BASE_URL}/v1/models`, {
	method: "GET",
	headers: {
	"Authorization": `Bearer ${LLM_API_KEY}`,
	"Content-Type": "application/json"
	}
});
```
.env for LLM_BASE_URL and LLM_API_KEY using dotenv
AI should have tools to be able to use google calendar and tasks api endpoints (basic CRUD operations).

### Frontend
React interface
Mobile first design
Bottom tab navigation
	- Chat (default)
	- Calendar display
	- Tasks display
	- Meditation display (box breathing)
Drawer navigation with hamburger icon in header to open drawer for future features

### Other
Extensive logging for frontend and backend

# Future features to know about
- Group chat with AI bot
- Passive monitoring of typing patterns/app usage to identify when you're in flow vs. distracted