#!/bin/bash

# Fix dpkg if needed
echo "Fixing dpkg configuration..."
sudo dpkg --configure -a 2>/dev/null || true

# Install Node.js using nvm (more reliable)
echo "Installing Node.js..."

# Install nvm
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install 20
nvm use 20

# Verify installation
echo "Node.js version:"
node --version
echo "npm version:"
npm --version

echo "Installation complete!"
