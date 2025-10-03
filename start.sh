#!/bin/sh
echo "Running database migrations..."
node backend/migrate.js
echo "Starting server..."
node backend/server.js
