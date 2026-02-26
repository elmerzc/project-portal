#!/bin/bash
# Command Center - Start Script
# Launches the Command Center server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

# Ensure tmux session exists
tmux has-session -t command-center 2>/dev/null || tmux new-session -d -s command-center -n main

# Start the server
echo ""
echo "  Starting Command Center..."
echo ""
node server/index.js
