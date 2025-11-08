@echo off
echo ========================================
echo  AI Newsroom Simulator - Clean Restart
echo ========================================
echo.

echo [1/5] Killing backend server (port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo    Killing PID %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo [2/5] Killing Vite dev servers (ports 5173-5180)...
for /l %%p in (5173,1,5180) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        echo    Killing PID %%a on port %%p
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo [3/5] Killing any concurrently.exe processes...
taskkill /F /IM concurrently.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Concurrently processes terminated
) else (
    echo    ℹ No concurrently processes found
)

echo.
echo [4/5] Waiting for cleanup...
timeout /t 3 /nobreak >nul

echo.
echo [5/5] Starting development servers...
start "AI Newsroom Dev" cmd /c "npm run dev"

echo.
echo ========================================
echo  Servers starting...
echo.
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173 (or next available)
echo.
echo  Wait ~10 seconds for servers to start
echo  Check the new terminal window for ports
echo ========================================
echo.
