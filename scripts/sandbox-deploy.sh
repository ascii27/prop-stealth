#!/bin/bash
# Deploy latest changes to the exe.dev sandbox
# Usage: ./scripts/sandbox-deploy.sh [branch]

set -e

SANDBOX="wyvern-zebra.exe.xyz"
PROJECT_DIR="prop-stealth"
BRANCH="${1:-$(git branch --show-current)}"

echo "==> Deploying branch '$BRANCH' to $SANDBOX"

ssh "$SANDBOX" bash -s "$PROJECT_DIR" "$BRANCH" << 'REMOTE_SCRIPT'
PROJECT_DIR="$1"
BRANCH="$2"
cd "$PROJECT_DIR"

echo "==> Pulling latest..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Installing dependencies..."
npm install

echo "==> Running migrations..."
npm run migrate -w api

echo "==> Building web..."
npm run build -w web

echo "==> Stopping existing servers..."
pkill -f "tsx.*src/index.ts" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 4000/tcp 2>/dev/null || true
sleep 2

echo "==> Starting API server..."
cd api
nohup npx tsx src/index.ts > /tmp/propstealth-api.log 2>&1 &
echo "API PID: $!"
cd ..

echo "==> Starting web server..."
cd web
nohup npx next start -p 8000 -H 0.0.0.0 > /tmp/propstealth-web.log 2>&1 &
echo "Web PID: $!"
cd ..

sleep 3
echo ""
echo "==> Verifying..."
curl -s http://localhost:4000/api/health
echo ""
curl -s -o /dev/null -w "Web: HTTP %{http_code}" http://localhost:8000
echo ""
echo ""
echo "==> Deployed! App running at https://$HOSTNAME"
REMOTE_SCRIPT
