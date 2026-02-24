const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const TmuxManager = require('./tmux-manager');
const SessionMonitor = require('./session-monitor');
const NotificationService = require('./notification-service');

// Load configuration
const settings = require('../config/settings.json');
let projects = [];
try {
  projects = require('../config/projects.json');
} catch {
  projects = [];
}

// Initialize services
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const notificationService = new NotificationService();
notificationService.setSocketIO(io);

const tmuxManager = new TmuxManager();
const sessionMonitor = new SessionMonitor(tmuxManager, notificationService);

// Middleware
app.use(express.json());

// Serve static client files
app.use('/dashboard', express.static(path.join(__dirname, '../client')));

// Serve the existing portal at root
app.use(express.static(path.join(__dirname, '..')));

// --- API Routes ---

/**
 * GET /api/projects - List all configured projects
 */
app.get('/api/projects', (req, res) => {
  // Reload projects from disk
  try {
    delete require.cache[require.resolve('../config/projects.json')];
    projects = require('../config/projects.json');
  } catch { /* use cached */ }

  res.json(projects);
});

/**
 * POST /api/sessions/launch - Start a new Claude Code session
 */
app.post('/api/sessions/launch', (req, res) => {
  try {
    const { projectName, slug, repoUrl, workingDirectory, yoloMode, initialPrompt, color } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'projectName is required' });
    }

    const session = tmuxManager.launch({
      projectName,
      slug,
      repoUrl,
      workingDirectory,
      yoloMode,
      initialPrompt,
      color,
    });

    // Notify all clients
    notificationService.send({
      type: 'launched',
      sessionId: session.id,
      projectName,
      title: 'Session Launched',
      body: `${projectName} session started${yoloMode ? ' (YOLO mode)' : ''}`,
      icon: 'launch',
    });

    io.emit('session:launched', session);

    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * DELETE /api/sessions/:id - Kill a session
 */
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const result = tmuxManager.kill(req.params.id);

    io.emit('session:killed', { id: req.params.id });

    res.json(result);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/**
 * GET /api/sessions - List all active sessions with status
 */
app.get('/api/sessions', (req, res) => {
  const sessions = tmuxManager.listAll();
  res.json(sessions);
});

/**
 * GET /api/sessions/:id/status - Get detailed status of one session
 */
app.get('/api/sessions/:id/status', (req, res) => {
  try {
    const session = tmuxManager.getStatus(req.params.id);
    res.json(session);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/**
 * GET /api/sessions/:id/output - Get recent output
 */
app.get('/api/sessions/:id/output', (req, res) => {
  try {
    const session = tmuxManager.getStatus(req.params.id);
    res.json({ id: session.id, output: session.lastOutput });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/**
 * POST /api/sessions/:id/input - Send input to a session
 */
app.post('/api/sessions/:id/input', (req, res) => {
  try {
    const { text } = req.body;
    if (text === undefined) {
      return res.status(400).json({ error: 'text is required' });
    }
    const result = tmuxManager.sendInput(req.params.id, text);
    res.json(result);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/**
 * GET /api/notifications - Get notification history
 */
app.get('/api/notifications', (req, res) => {
  res.json({
    notifications: notificationService.getHistory(),
    unread: notificationService.unreadCount(),
  });
});

/**
 * POST /api/notifications/read - Mark all as read
 */
app.post('/api/notifications/read', (req, res) => {
  notificationService.markAllRead();
  res.json({ success: true });
});

/**
 * GET /api/settings - Get current settings
 */
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

// --- WebSocket connections ---
io.on('connection', (socket) => {
  // Send current state on connect
  socket.emit('init', {
    sessions: tmuxManager.listAll(),
    notifications: notificationService.getHistory(),
    projects,
  });

  // Handle terminal attach requests
  socket.on('terminal:attach', (sessionId) => {
    try {
      const session = tmuxManager.sessions.get(sessionId);
      if (!session) {
        socket.emit('terminal:error', { error: 'Session not found' });
        return;
      }

      // Start streaming output for this session
      const outputInterval = setInterval(() => {
        try {
          const output = tmuxManager.captureOutput(session.windowName, 200);
          socket.emit('terminal:data', { sessionId, data: output });
        } catch {
          clearInterval(outputInterval);
        }
      }, 500);

      socket.on('terminal:input', (data) => {
        if (data.sessionId === sessionId) {
          try {
            tmuxManager.sendInput(sessionId, data.text);
          } catch { /* ignore */ }
        }
      });

      socket.on('terminal:detach', () => {
        clearInterval(outputInterval);
      });

      socket.on('disconnect', () => {
        clearInterval(outputInterval);
      });
    } catch (e) {
      socket.emit('terminal:error', { error: e.message });
    }
  });

  // Handle input from dashboard
  socket.on('session:input', ({ sessionId, text }) => {
    try {
      tmuxManager.sendInput(sessionId, text);
    } catch { /* ignore */ }
  });
});

// Dashboard route - serve command center HTML
app.get('/dashboard', (req, res, next) => {
  // Redirect /dashboard to /dashboard/ (only if no trailing slash)
  if (!req.originalUrl.endsWith('/')) {
    return res.redirect('/dashboard/');
  }
  res.sendFile(path.join(__dirname, '../client/command-center.html'));
});

// --- Start server ---
const PORT = settings.port;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Command Center running at:`);
  console.log(`    Local:     http://localhost:${PORT}`);
  console.log(`    Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`    Portal:    http://localhost:${PORT}/`);
  console.log(`\n  Monitoring ${projects.length} projects`);
  console.log(`  tmux session: ${TMUX_SESSION}\n`);

  // Start session monitoring
  sessionMonitor.start();
});

const TMUX_SESSION = settings.tmuxSession;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Command Center...');
  sessionMonitor.stop();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sessionMonitor.stop();
  server.close();
  process.exit(0);
});
