# Project Portal v1.4 — Command Center Dashboard

## Overview
New local Command Center dashboard added to Project Portal. Runs as a Node.js/Express server on WSL, providing a web-based interface to manage Claude Code sessions via tmux. Includes real-time WebSocket updates, session monitoring, and a "New Project" modal with GitHub repo cloning.

## Live URL
- **Command Center (local)**: http://localhost:3456/dashboard/
- **Project Portal (public)**: https://ct-project-portal.netlify.app
- **GitHub**: https://github.com/elmerzc/project-portal

## Tech Stack
- Node.js / Express server (port 3456)
- WebSocket (ws) for real-time session updates
- tmux for managing Claude Code terminal sessions
- HTML/CSS/JS client (no framework)
- GitHub API for repo metadata fetching
- `child_process` for git clone and tmux commands

## Features

### Command Center Dashboard
- [x] Express server with WebSocket support on port 3456
- [x] Dashboard UI at `/dashboard/` with dark theme
- [x] Project cards loaded from `config/projects.json`
- [x] Launch Claude Code sessions via tmux (one-click)
- [x] Real-time session status monitoring (running/stopped)
- [x] WebSocket live updates when sessions start/stop
- [x] Session monitor auto-checks tmux sessions periodically
- [x] Notification service for session events
- [x] tmux manager for creating/attaching/killing sessions
- [x] Color-coded project cards matching project theme colors

### New Project Feature (Create + GitHub Clone)
- [x] "New Project" button in dashboard toolbar
- [x] Modal with GitHub URL input + "Fetch Info" button
- [x] Auto-fills project name, slug, description, repo URL, directory from GitHub API
- [x] Auto-generates slug from project name (lowercase, hyphenated)
- [x] Auto-assigns color from preset palette
- [x] Manual entry mode — fill in all fields by hand
- [x] "Clone repository" checkbox (default checked when GitHub URL provided)
- [x] Clones repo to `/home/user/projects/{slug}/` via server-side `git clone`
- [x] Saves new project to `config/projects.json`
- [x] Prevents duplicate slugs
- [x] New project card appears immediately in dashboard (no refresh needed)
- [x] Loading spinner during clone operation

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects from config |
| POST | `/api/projects` | Add a new project to config |
| POST | `/api/projects/github-info` | Fetch repo metadata from GitHub API |
| POST | `/api/projects/clone` | Clone a GitHub repo locally |
| GET | `/api/sessions` | List active tmux sessions |
| POST | `/api/sessions/:slug/launch` | Launch Claude Code in tmux |
| POST | `/api/sessions/:slug/stop` | Stop a tmux session |
| GET | `/api/github/repo` | Fetch GitHub repo info |

## Files Added (19 files, ~5,100 lines)

### Server
- `server/index.js` — Express server, API routes, WebSocket, static file serving
- `server/tmux-manager.js` — tmux session create/attach/kill/list operations
- `server/session-monitor.js` — Periodic session status checker
- `server/notification-service.js` — Event notifications for session changes

### Client
- `client/command-center.html` — Dashboard page with project grid, modals, toolbar
- `client/css/command-center.css` — Full dark-theme styles for dashboard
- `client/js/app.js` — Main app logic: project rendering, modal handling, GitHub fetch, new project form
- `client/js/websocket.js` — WebSocket client for live session updates
- `client/js/terminal.js` — Terminal interaction utilities
- `client/js/notifications.js` — Client-side notification toasts

### Config
- `config/projects.json` — Project definitions (5 initial projects)
- `config/settings.json` — Server settings (port, tmux session prefix)

### Scripts
- `scripts/install.sh` — Install dependencies
- `scripts/start.sh` — Start the Command Center server
- `scripts/tmux-setup.sh` — tmux environment setup

### Root
- `package.json` — Node.js dependencies (express, ws)
- `package-lock.json` — Dependency lock file
- `.gitignore` — node_modules exclusion

## Branch
- **Development branch**: `claude/command-center-dashboard-LqYgP`
- **Status**: Feature complete, tested, ready for merge to main when approved

## How to Run
```bash
cd ~/project-portal
npm install
node server/index.js
# Open http://localhost:3456/dashboard/
```

## What's Next (Future Ideas)
- [ ] Merge Command Center branch to main
- [ ] Session output/log viewer in the dashboard
- [ ] Multi-project bulk operations (start/stop all)
- [ ] Project grouping by category
- [ ] Dashboard search/filter for projects
- [ ] Import projects from existing local directories
- [ ] Settings page for server configuration
