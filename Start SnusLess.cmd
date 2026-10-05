@echo off
setlocal
cd /d "%~dp0web"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is missing. Install Node.js 24 LTS, then try again.
  pause
  exit /b 1
)
if not exist "node_modules\vinext\dist\cli.js" (
  echo Installing website dependencies...
  call npm.cmd run install:ci
  if errorlevel 1 (
    echo Installation failed. See the message above.
    pause
    exit /b 1
  )
)
echo.
echo Open http://127.0.0.1:5173 and choose "Fortsatt utan konto".
echo Keep this window open. Press Ctrl+C to stop the website.
echo.
call npm.cmd run dev -- --hostname 127.0.0.1
pause
