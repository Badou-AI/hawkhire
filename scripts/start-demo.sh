#!/bin/bash

# Start Demo Script for HawkHire
# This script starts both the frontend and backend servers for the demo

echo "Starting HawkHire Demo Environment"
echo "=================================="

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Error: ngrok is not installed. Please install it first."
    exit 1
fi

# Function to check if a port is in use
is_port_in_use() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Start the backend server
echo "Starting backend server..."
cd backend
if is_port_in_use 8080; then
    echo "Warning: Port 8080 is already in use. Backend may already be running."
else
    # Start the backend server in the background
    python -m app.main &
    BACKEND_PID=$!
    echo "Backend server started with PID: $BACKEND_PID"
fi
cd ..

# Start the frontend server
echo "Starting frontend server..."
if is_port_in_use 3000; then
    echo "Warning: Port 3000 is already in use. Frontend may already be running."
else
    # Start the frontend server in the background
    npm run start &
    FRONTEND_PID=$!
    echo "Frontend server started with PID: $FRONTEND_PID"
fi

# Start ngrok tunnels
echo "Starting ngrok tunnels..."
echo "Starting tunnel for backend (api.hawkhire.ai)..."
ngrok http --domain=api.hawkhire.ai 8080 &
NGROK_BACKEND_PID=$!

echo "Starting tunnel for frontend (beta.hawkhire.ai)..."
ngrok http --domain=beta.hawkhire.ai 3000 &
NGROK_FRONTEND_PID=$!

echo "Demo environment is now running!"
echo "Frontend: https://beta.hawkhire.ai"
echo "Backend: https://api.hawkhire.ai"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID $NGROK_BACKEND_PID $NGROK_FRONTEND_PID 2>/dev/null; exit" INT
wait 