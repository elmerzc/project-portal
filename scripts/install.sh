#!/bin/bash
# Command Center - Installation Script
# Sets up the Command Center for Claude Code session management

set -e

echo ""
echo "  Command Center - Setup"
echo "  ======================"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required. Install it first."; exit 1; }
command -v tmux >/dev/null 2>&1 || { echo "Error: tmux is required. Install with: sudo apt install tmux"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "Warning: Claude Code CLI not found. Sessions will fail to launch."; }

# Get script directory (project root)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "  Installing dependencies..."
npm install --production

echo ""
echo "  Creating tmux session..."
tmux has-session -t command-center 2>/dev/null || tmux new-session -d -s command-center -n main
echo "  tmux session 'command-center' ready."

echo ""
echo "  Setup complete!"
echo ""
echo "  To start the Command Center:"
echo "    npm start"
echo ""
echo "  Or use the start script:"
echo "    ./scripts/start.sh"
echo ""
echo "  Dashboard: http://localhost:3456/dashboard"
echo "  Portal:    http://localhost:3456/"
echo ""
