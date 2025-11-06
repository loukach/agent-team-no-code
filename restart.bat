@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe
timeout /t 2

echo.
echo Starting backend server...
start "Backend Server" cmd /k "node server/index.js"
timeout /t 3

echo.
echo Starting frontend...
start "Frontend" cmd /k "cd client && npm run dev"

echo.
echo Servers starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5174
echo.
echo Wait 5 seconds, then open: http://localhost:5174
pause
