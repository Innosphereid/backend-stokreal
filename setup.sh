#!/bin/bash

# Development setup script for the boilerplate project

echo "🚀 Setting up the development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials"
fi

# Create database (optional - user needs to have createdb permissions)
echo "🗄️  Setting up database..."
echo "Please make sure PostgreSQL is running and create the database manually:"
echo "createdb boilerplate_db"
echo "createdb boilerplate_test_db"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Create databases: createdb boilerplate_db && createdb boilerplate_test_db"
echo "3. Run migrations: npm run migrate:latest"
echo "4. Seed database (optional): npm run seed:run"
echo "5. Start development server: npm run dev"
echo ""
echo "📚 Check README.md for detailed documentation"