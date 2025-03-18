# HawkHire Demo Setup

This document provides instructions for setting up and running a demo of the HawkHire application using ngrok tunnels.

## Prerequisites

1. **ngrok account with reserved domains**:
   - You need an ngrok account with the following reserved domains:
     - `api.hawkhire.ai` - for the backend API
     - `beta.hawkhire.ai` - for the frontend application

2. **ngrok CLI installed**:
   - Download and install ngrok from [https://ngrok.com/download](https://ngrok.com/download)
   - Authenticate with your ngrok account: `ngrok authtoken YOUR_AUTH_TOKEN`

3. **Node.js and npm**:
   - Required for running the frontend application

4. **Python 3.9+**:
   - Required for running the backend API

## Configuration

The demo setup uses the following environment files:

1. **Frontend (.env.local)**:
   ```
   NEXT_PUBLIC_API_URL=https://api.hawkhire.ai
   PYTHON_API_URL=https://api.hawkhire.ai
   NEXT_PUBLIC_SITE_URL=https://beta.hawkhire.ai
   NODE_ENV=production
   ```

2. **Backend (backend/.env)**:
   ```
   HOST=0.0.0.0
   FRONTEND_URL=https://beta.hawkhire.ai
   ```

## Running the Demo

### Option 1: Using the provided scripts

#### For Unix/Linux/macOS:
```bash
./scripts/start-demo.sh
```

#### For Windows:
```cmd
scripts\start-demo.bat
```

### Option 2: Manual setup

1. **Start the backend server**:
   ```bash
   cd backend
   python -m app.main
   ```

2. **Start the frontend server**:
   ```bash
   npm run start
   ```

3. **Start ngrok tunnels** (in separate terminals):
   ```bash
   ngrok http --domain=api.hawkhire.ai 8080
   ngrok http --domain=beta.hawkhire.ai 3000
   ```

## Accessing the Demo

Once everything is running, you can access the demo at:

- Frontend: [https://beta.hawkhire.ai](https://beta.hawkhire.ai)
- Backend API: [https://api.hawkhire.ai](https://api.hawkhire.ai)

## Troubleshooting

1. **Port already in use**:
   - Check if another process is using port 3000 or 8080
   - Use `lsof -i :PORT` (Unix) or `netstat -ano | findstr :PORT` (Windows) to find the process
   - Kill the process or use different ports

2. **ngrok connection issues**:
   - Ensure your ngrok authtoken is correctly set
   - Check that your reserved domains are properly configured
   - Verify your ngrok account has the necessary privileges for reserved domains

3. **CORS errors**:
   - If you see CORS errors in the browser console, ensure the backend CORS configuration includes all necessary origins
   - The backend should allow requests from `https://beta.hawkhire.ai`

## Stopping the Demo

- If using the scripts, press Ctrl+C to stop all services
- If running manually, stop each process separately (Ctrl+C in each terminal) 