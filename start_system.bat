@echo off
echo ====================================================================
echo     GeM AI Bid Compliance Verification System - System Launcher
echo ====================================================================
echo.

echo Starting FastAPI Backend Services (Port 8000)...
start "GeM AI Backend API" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting React Frontend Dashboard (Port 5173)...
start "GeM AI React Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services are starting!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo React Dashboard:  http://localhost:5173
echo ====================================================================
pause
