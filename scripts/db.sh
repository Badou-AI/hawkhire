#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: ./db.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the database containers"
    echo "  stop      - Stop the database containers"
    echo "  restart   - Restart the database containers"
    echo "  migrate   - Run database migrations"
    echo "  psql      - Open PostgreSQL CLI"
    echo "  reset     - Reset the database (warning: destructive)"
    echo "  status    - Show container status"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running"
        exit 1
    fi
}

case "$1" in
    "start")
        check_docker
        echo "Starting database containers..."
        docker-compose up -d
        echo "Containers started. pgAdmin available at http://localhost:5050"
        ;;
    
    "stop")
        check_docker
        echo "Stopping database containers..."
        docker-compose down
        ;;
    
    "restart")
        check_docker
        echo "Restarting database containers..."
        docker-compose down
        docker-compose up -d
        ;;
    
    "migrate")
        check_docker
        echo "Running migrations..."
        docker exec hawkhire_db psql -U postgres -d hawkhire -f /docker-entrypoint-initdb.d/20240129120000_organization_enhancements.sql
        ;;
    
    "psql")
        check_docker
        echo "Opening PostgreSQL CLI..."
        docker exec -it hawkhire_db psql -U postgres -d hawkhire
        ;;
    
    "reset")
        check_docker
        echo "Warning: This will delete all data. Are you sure? (y/N)"
        read -r confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo "Resetting database..."
            docker-compose down -v
            docker-compose up -d
        else
            echo "Reset cancelled"
        fi
        ;;
    
    "status")
        check_docker
        echo "Container status:"
        docker-compose ps
        ;;
    
    *)
        show_usage
        ;;
esac 