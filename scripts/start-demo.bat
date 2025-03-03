@echo off
echo Starting HawkHire Demo Environment
echo ==================================

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: ngrok is not installed. Please install it first.
    exit /b 1
)

REM Start the backend server
echo Starting backend server...
cd backend
REM Check if port 8080 is in use
netstat -ano | findstr :8080 >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 8080 is already in use. Backend may already be running.
) else (
    REM Start the backend server in a new window
    start "HawkHire Backend" cmd /c "python -m app.main"
    echo Backend server started.
)
cd ..

REM Start the frontend server
echo Starting frontend server...
REM Check if port 3000 is in use
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 3000 is already in use. Frontend may already be running.
) else (
    REM Start the frontend server in a new window
    start "HawkHire Frontend" cmd /c "npm run start"
    echo Frontend server started.
)

REM Start ngrok tunnels
echo Starting ngrok tunnels...
echo Starting tunnel for backend (api.hawkhire.ai)...
start "Ngrok Backend" cmd /c "ngrok http --domain=api.hawkhire.ai 8080"

echo Starting tunnel for frontend (beta.hawkhire.ai)...
start "Ngrok Frontend" cmd /c "ngrok http --domain=beta.hawkhire.ai 3000"

echo Demo environment is now running!
echo Frontend: https://beta.hawkhire.ai
echo Backend: https://api.hawkhire.ai
echo.
echo Close the command windows to stop the services.
pause 