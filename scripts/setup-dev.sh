#!/bin/bash

echo "🚀 Setting up HawkHire development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Stop any existing containers and clean up
echo "🧹 Cleaning up existing containers..."
docker-compose down -v
docker system prune -f

# Start the database
echo "📦 Starting database container..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations in order
echo "🔄 Running migrations..."

# Initial schema
echo "1️⃣ Creating initial schema..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320000000_initial_schema.sql

# Auth schema and functions
echo "2️⃣ Setting up auth schema..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320001000_fix_auth_schema.sql

# Auth functions
echo "3️⃣ Creating auth functions..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320002000_auth_functions.sql

# Fix policies
echo "4️⃣ Setting up policies..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320003000_fix_policies.sql

# Verify setup
echo "✅ Verifying setup..."
docker exec -i hawkhire_db psql -U postgres -d postgres -c "\dt"

echo "🎉 Development environment setup complete!"
echo "
Next steps:
1. Start your Next.js development server: npm run dev
2. Visit http://localhost:3000 to view your application
" 