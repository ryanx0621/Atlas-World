@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ==================================================
echo Atlas-World - Ollama Starter
echo ==================================================

where ollama >nul 2>&1
if errorlevel 1 (
    echo [Error] Ollama was not found on this system.
    pause
    exit /b 1
)

echo [Info] Listing local models...
ollama list
echo.
echo [Guide] How to install remote models:
echo 1. Search for models at: https://ollama.com/library
echo 2. Run this command in terminal: ollama pull [model_name]
echo    Example: ollama pull llama3
echo.

set "MODEL=gemma3:1b"
set /p "INPUT_MODEL=Enter model name (Default: gemma3:1b): "
if not "!INPUT_MODEL!"=="" set "MODEL=!INPUT_MODEL!"

echo [Info] Checking model status: !MODEL!
ollama list > "%TEMP%\ollama_check.txt" 2>&1
findstr /I /C:"!MODEL!" "%TEMP%\ollama_check.txt" >nul 2>&1
if errorlevel 1 (
    echo [Info] !MODEL! not found. Pulling from Ollama library...
    ollama pull !MODEL!
    if errorlevel 1 (
        echo [Error] Could not find or pull model: !MODEL!
        pause
        exit /b 1
    )
)

echo [Info] Starting Ollama server in a new window...
start "Ollama Backend (!MODEL!)" powershell -NoExit -Command "chcp 65001; ollama run !MODEL!"

echo.
echo --------------------------------------------------
echo [1/2] Ollama backend is running.
echo [2/2] Launching Python Chatbot service now...
echo --------------------------------------------------

set "EXPORT_MODEL=!MODEL!"
endlocal & set "OLLAMA_MODEL=%EXPORT_MODEL%"

uv run ./script/chatbot.py