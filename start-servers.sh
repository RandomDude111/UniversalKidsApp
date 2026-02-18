#!/usr/bin/env bash
set -euo pipefail

# start-servers.sh — install deps, start ai-proxy in background, run vite dev
# Usage: ./start-servers.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Project root: $ROOT_DIR"

# Install node deps if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "node_modules not found — running npm install (this may take a minute)..."
  npm install
else
  echo "node_modules exists — skipping npm install"
fi

mkdir -p server/logs

echo "Starting AI proxy (server/ai-proxy.js) in background..."
nohup node server/ai-proxy.js > server/logs/ai-proxy.log 2>&1 &
PROXY_PID=$!
echo $PROXY_PID > server/logs/ai-proxy.pid
echo "AI proxy started (pid=$PROXY_PID). Logs: server/logs/ai-proxy.log"

echo "Waiting briefly for proxy to initialize..."
sleep 1

echo "Starting frontend dev server (vite)..."
npm run dev

# When the user stops the dev server (Ctrl+C), optionally stop the background proxy
echo "Dev server exited. Proxy (pid=$PROXY_PID) is still running." 
echo "To stop the proxy: kill $PROXY_PID or run: kill \\$(cat server/logs/ai-proxy.pid)"
