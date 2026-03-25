#!/bin/bash

# BookSurfer - Setup Script
# This script sets up all improvements and gets the project ready for development

set -e

echo "📚 BookSurfer - Setup Script"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Installing dev dependencies..."
npm install --save-dev pytest

echo ""
echo "⚙️  Installing testing libraries..."
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

echo ""
echo "🔐 Installing security packages..."
npm install @tanstack/react-query zod

echo ""
echo "📊 Setting up environment..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your OAuth credentials!"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🧪 Running ESLint check..."
npm run lint || echo "⚠️  Some linting issues found. Fix them with: npm run lint"

echo ""
echo "🏗️  Building project..."
npm run build

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your OAuth credentials"
echo "2. Run 'npm run dev' to start development"
echo "3. Visit http://localhost:3000"
echo ""
echo "Resources:"
echo "- Setup Guide: docs/ENVIRONMENT.md"
echo "- Architecture: docs/ARCHITECTURE.md"
echo "- Testing: npm test"
echo "- Docker: docker-compose up"
