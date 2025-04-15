@echo off
setlocal

REM Navigate to the base project directory
cd /d "C:\Users\dh4nu\Desktop\skillExchange"

REM Start Flask backend in new terminal
start cmd /k "cd backend && echo Starting Flask backend... && python app.py"

REM Start Next.js frontend in new terminal using npx
start cmd /k "cd frontend && echo Starting Next.js frontend... && npx next dev"

echo Both backend and frontend are launching...
exit
