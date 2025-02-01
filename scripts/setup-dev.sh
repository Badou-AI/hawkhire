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

# 1. Initial schema
echo "1️⃣ Creating initial schema..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320100000_initial_schema.sql

# 2. Create testimonials and news tables
echo "2️⃣ Creating testimonials and news tables..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320200000_create_testimonials_and_news.sql

# 3. Auth functions
echo "3️⃣ Creating auth functions..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320300000_auth_functions.sql

# 4. Auth schema
echo "4️⃣ Setting up auth schema..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320400000_fix_auth_schema.sql

# 5. Fix policies
echo "5️⃣ Setting up policies..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320500000_fix_policies.sql

# 6. Create companies tables
echo "6️⃣ Creating companies tables..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320600000_create_companies_table.sql
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/migrations/20240320700000_create_companies.sql

# Apply seed data
echo "7️⃣ Seeding development data..."
docker exec -i hawkhire_db psql -U postgres -d postgres < supabase/seed.sql

# Verify setup
echo "✅ Verifying setup..."
docker exec -i hawkhire_db psql -U postgres -d postgres -c "\dt"

echo "🎉 Development environment setup complete!"
echo "
Next steps:
1. Start your Next.js development server: npm run dev
2. Visit http://localhost:3000 to view your application
" 