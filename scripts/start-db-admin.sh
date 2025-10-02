#!/bin/bash

echo "Starting database admin tools..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    # Check if Colima is running
    if command -v colima &> /dev/null && colima list 2>/dev/null | grep -q "Running"; then
        echo "🔧 Colima is running but Docker connection failed. Trying to fix..."
        # Ensure we're using the colima context
        docker context use colima &> /dev/null || true
        sleep 1
        # Try again
        if ! docker info &> /dev/null; then
            echo "❌ Colima is running but Docker still can't connect."
            echo "💡 Try: colima stop && colima start"
            exit 1
        fi
        echo "✅ Fixed Docker connection to Colima"
    else
        echo "❌ Docker daemon is not running. Please start Docker first."
        echo ""
        echo "💡 Quick fixes:"
        echo "   • Open Docker Desktop application"
        echo "   • Or run: colima start (if using Colima)"
        echo "   • Or run: brew services start docker (if using Homebrew)"
        exit 1
    fi
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Starting it..."
    if command -v brew &> /dev/null; then
        brew services start postgresql
        sleep 2
    else
        echo "Please start PostgreSQL manually"
        exit 1
    fi
fi

echo "✅ All prerequisites met. Starting admin tools..."
docker-compose up -d

echo ""
echo "🎉 Database admin tools started!"
echo "   • Adminer: http://localhost:5051 (PostgreSQL web admin)"
echo "   • PostgREST API: http://localhost:3001"
echo ""
echo "To stop: npm run stop:db-admin"