#!/bin/bash
# Command Center - tmux Session Setup
# Creates the main tmux session for the command center

SESSION_NAME="command-center"

# Kill existing session if requested
if [ "$1" = "--reset" ]; then
  echo "Resetting tmux session..."
  tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
fi

# Create session if it doesn't exist
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux new-session -d -s "$SESSION_NAME" -n main
  echo "Created tmux session: $SESSION_NAME"
else
  echo "tmux session '$SESSION_NAME' already exists"
fi

echo ""
echo "To attach: tmux attach -t $SESSION_NAME"
echo "To list windows: tmux list-windows -t $SESSION_NAME"
