#!/bin/bash

# Configuration
BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_URL="http://localhost:3000/health"
CHECK_INTERVAL=180  # 3 minutes in seconds
LOG_FILE="$BOT_DIR/watchdog.log"
PID_FILE="$BOT_DIR/bot.pid"

# Change to bot directory
cd "$BOT_DIR" || exit 1

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to start the bot
start_bot() {
    log "Starting Discord bot..."
    
    # Kill any existing bot process
    if [ -f "$PID_FILE" ]; then
        old_pid=$(cat "$PID_FILE")
        if ps -p "$old_pid" > /dev/null 2>&1; then
            log "Killing old process (PID: $old_pid)"
            kill -9 "$old_pid" 2>/dev/null
        fi
        rm "$PID_FILE"
    fi
    
    # Kill any orphaned node processes running main.js
    pkill -f "node.*dist/main.js" 2>/dev/null
    
    # Build the project first to ensure all changes are compiled
    log "Building TypeScript project..."
    npm run build >> "$BOT_DIR/build.log" 2>&1
    if [ $? -ne 0 ]; then
        log "ERROR: Build failed! Check build.log for details"
        return 1
    fi
    log "Build completed successfully"
    
    # Start the bot in background
    npm start > "$BOT_DIR/bot.log" 2>&1 &
    BOT_PID=$!
    echo "$BOT_PID" > "$PID_FILE"
    log "Bot started with PID: $BOT_PID"
    
    # Wait for the bot to initialize
    sleep 10
}

# Function to check if bot is healthy
check_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Trap EXIT signal to cleanup
cleanup() {
    log "Watchdog shutting down..."
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log "Stopping bot (PID: $pid)"
            kill "$pid" 2>/dev/null
        fi
        rm "$PID_FILE"
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Initial start
log "========================================="
log "Watchdog script started"
start_bot

# Main monitoring loop
while true; do
    sleep "$CHECK_INTERVAL"
    
    if check_health; then
        log "Health check passed ✓"
    else
        log "Health check failed ✗ - Restarting bot..."
        start_bot
    fi
done
