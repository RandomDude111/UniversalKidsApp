#!/bin/bash

# Universal Kids App - Server Launcher
# This script starts the development server

cd "$(dirname "$0")"

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set PATH to include Node.js
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"

echo "=========================================="
echo "Universal Kids App - Dev Server"
echo "=========================================="
echo ""
echo "Starting development server..."
echo ""

npm run dev

# Keep window open if there's an error
echo ""
echo "Press Enter to close this window..."
read
