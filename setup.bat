@echo off
REM BookSurfer - Setup Script (Windows)
REM This script sets up all improvements and gets the project ready for development

echo 📚 BookSurfer - Setup Script
echo =============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Installing dev dependencies...
call npm install --save-dev jest

echo.
echo ⚙️  Installing testing libraries...
call npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

echo.
echo 🔐 Installing security packages...
call npm install @tanstack/react-query zod

echo.
echo 📊 Setting up environment...
if not exist .env.local (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ⚠️  Please edit .env.local with your OAuth credentials!
) else (
    echo ✅ .env.local already exists
)

echo.
echo 🧪 Running ESLint check...
call npm run lint

echo.
echo 🏗️  Building project...
call npm run build

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Edit .env.local with your OAuth credentials
echo 2. Run 'npm run dev' to start development
echo 3. Visit http://localhost:3000
echo.
echo Resources:
echo - Setup Guide: docs/ENVIRONMENT.md
echo - Architecture: docs/ARCHITECTURE.md
echo - Testing: npm test
echo - Docker: docker-compose up
