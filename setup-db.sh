#!/bin/bash

# AuraFlow Database Setup Script

echo "Setting up AuraFlow database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "  brew install postgresql"
    echo "  brew services start postgresql"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL is not running. Starting it..."
    brew services start postgresql
    sleep 2
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw auraflow; then
    echo "Creating auraflow database..."
    createdb auraflow
else
    echo "Database 'auraflow' already exists."
fi

# Run schema
echo "Setting up database schema..."
psql auraflow < backend/db/schema.sql

echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your LLM_API_KEY if needed"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm start"
echo "4. Visit http://localhost:3000 and sign in with Google"