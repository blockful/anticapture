#!/bin/bash

# File: reset-indexer.sh
# Script to reset the entire indexing environment for clean testing

echo "🧹 Resetting indexer environment for clean testing..."

# Stop all containers
echo "📦 Stopping all Docker containers..."
docker compose down

# Remove the database volume to clear all indexed data
echo "🗄️  Removing database volume to clear indexed data..."
docker volume rm anticapture_postgres_data 2>/dev/null || true

# Remove any other persistent volumes if they exist
docker volume prune -f

# Clean up any orphaned containers
echo "🧽 Cleaning up orphaned containers..."
docker container prune -f

# Start the database first
echo "🚀 Starting database..."
docker compose up -d indexer-db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start the anvil blockchain (contracts service) with rebuild
echo "⛓️  Starting anvil blockchain (rebuilding if needed)..."
docker compose up -d --build contracts

# Wait for blockchain to be ready
echo "⏳ Waiting for blockchain to be ready..."
sleep 10

# Start the indexer (this will start from block 0) with rebuild
echo "📊 Starting indexer from block 0 (rebuilding if needed)..."
docker compose up -d --build indexer

echo "✅ Reset complete! The indexer is now running from a clean state."
echo ""
echo "📋 To monitor the services:"
echo "   - View logs: docker compose logs -f"
echo "   - View indexer logs: docker compose logs -f indexer"
echo "   - View contracts logs: docker compose logs -f contracts"
echo ""
echo "🌐 Service URLs:"
echo "   - Indexer API: http://localhost:42069"
echo "   - Anvil RPC: http://localhost:8545"
echo "   - Database: postgres://postgres:admin@localhost:5432/postgres" 