#!/bin/bash
# Stop app servers on the sandbox
# Usage: ./scripts/sandbox-stop.sh

SANDBOX="wyvern-zebra.exe.xyz"

ssh "$SANDBOX" bash << 'REMOTE_SCRIPT'
echo "Stopping API server..."
pkill -f "tsx.*src/index.ts" 2>/dev/null && echo "  Stopped" || echo "  Not running"

echo "Stopping Web server..."
pkill -f "next start" 2>/dev/null && echo "  Stopped" || echo "  Not running"
REMOTE_SCRIPT
