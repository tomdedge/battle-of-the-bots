#!/bin/bash

echo "🚀 Setting up AuraFlow..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Create temp directory for TTS
echo "📁 Creating temp directories..."
mkdir -p backend/temp

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your database and API credentials"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "The app will be available at http://localhost:3000"
