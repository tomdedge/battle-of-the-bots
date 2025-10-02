#!/bin/bash

# Start both frontend and backend
echo "Starting AuraFlow fullstack application..."

# Start backend in background
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background  
echo "Starting frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
