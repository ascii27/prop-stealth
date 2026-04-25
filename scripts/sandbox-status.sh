#!/bin/bash
# Check sandbox status — is the app running?
# Usage: ./scripts/sandbox-status.sh

SANDBOX="wyvern-zebra.exe.xyz"

ssh "$SANDBOX" bash << 'REMOTE_SCRIPT'
echo "=== PropStealth Sandbox Status ==="
echo ""

echo "API server:"
if pgrep -f "tsx.*src/index.ts" > /dev/null; then
  echo "  Running (PID $(pgrep -f 'tsx.*src/index.ts'))"
  curl -s http://localhost:4000/api/health
  echo ""
else
  echo "  Not running"
fi

echo ""
echo "Web server:"
if pgrep -f "next start" > /dev/null; then
  echo "  Running (PID $(pgrep -f 'next start'))"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:8000
else
  echo "  Not running"
fi

echo ""
echo "PostgreSQL:"
if pg_isready -q 2>/dev/null; then
  echo "  Running"
else
  echo "  Not running"
fi

echo ""
echo "Branch: $(cd prop-stealth && git branch --show-current)"
echo "Latest commit: $(cd prop-stealth && git log --oneline -1)"
REMOTE_SCRIPT
