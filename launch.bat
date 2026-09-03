@echo off
cd /d "%~dp0"

:: Start FastAPI backend in background
start /B python api.py
echo FastAPI backend starting on port 8000...

:: Change to ai-dashboard directory and start frontend
cd /d "ai-dashboard"
npm start
echo Starting frontend dashboard...

:: Wait 4 seconds for services to initialize
timeout /T 4 /nobreak > nul

:: Open the dashboard in default browser
start "" http://localhost:3000
echo Opened http://localhost:3000 in your default browser
echo.
echo Second Brain KB is now running!
echo - API: http://localhost:8000
echo - Dashboard: http://localhost:3000
pause