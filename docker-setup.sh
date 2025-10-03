#!/bin/bash

echo "🐳 Setting up AuraFlow with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Created .env from .env.example"
        echo "⚠️  Please edit .env with your configuration before running docker-compose up"
    else
        echo "⚠️  No .env.example found. You'll need to create .env manually."
    fi
fi

echo "✅ Docker setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Run: docker-compose up --build"
echo "3. Access the app at http://localhost:3001"
