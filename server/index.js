const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const TmuxManager = require('./tmux-manager');
const SessionMonitor = require('./session-monitor');
const NotificationService = require('./notification-service');

// Load configuration
const settings = require('../config/settings.json');

// Parse portal projects from projects.js (the source of truth for all projects)
function loadPortalProjects() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../projects.js'), 'utf-8');
    // Extract the PROJECTS array and CATEGORIES object
    const sandbox = {};
    new Function('module', 'exports', raw + '\nmodule.exports = { PROJECTS, CATEGORIES };')(
      sandbox, {}
    );
    return sandbox.exports || { PROJECTS: [], CATEGORIES: {} };
  } catch (e) {
    console.error('Failed to parse projects.js:', e.message);
    return { PROJECTS: [], CATEGORIES: {} };
  }
}

// Load command center overrides (manually configured directories, modes, etc.)
function loadCCOverrides() {
  try {
    delete require.cache[require.resolve('../config/projects.json')];
    return require('../config/projects.json');
  } catch {
    return [];
  }
}

// Convert a portal project to command center format, applying any overrides
function toCommandCenterProject(portal, categories, override) {
  const slug = portal.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const categoryColor = categories[portal.category]?.color || '#58a6ff';
  const repoName = portal.github_repo ? portal.github_repo.split('/')[1] : slug;

  return {
    name: portal.name,
    slug,
    repo: portal.github_repo || '',
    directory: override?.directory || `/home/ezdev/projects/${repoName}`,
    defaultMode: override?.defaultMode || 'normal',
    color: override?.color || categoryColor,
    description: portal.description || '',
    // Extra fields from portal
    category: portal.category || '',
    progress: portal.progress || 0,
    github_url: portal.github_url || '',
    features: portal.features || [],
  };
}

// Build merged project list: portal projects + any CC-only projects
function buildProjectList() {
  const { PROJECTS: portalProjects, CATEGORIES: categories } = loadPortalProjects();
  const overrides = loadCCOverrides();

  // Index overrides by slug and by repo for matching
  const overrideBySlug = {};
  const overrideByRepo = {};
  overrides.forEach(o => {
    overrideBySlug[o.slug] = o;
    if (o.repo) overrideByRepo[o.repo] = o;
  });

  // Convert portal projects, applying any overrides
  const merged = portalProjects.map(p => {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const override = overrideBySlug[slug] || overrideByRepo[p.github_repo] || null;
    return toCommandCenterProject(p, categories, override);
  });

  // Add any CC-only projects that aren't in the portal
  const portalSlugs = new Set(merged.map(p => p.slug));
  const portalRepos = new Set(merged.map(p => p.repo));
  overrides.forEach(o => {
    if (!portalSlugs.has(o.slug) && !portalRepos.has(o.repo)) {
      merged.push(o);
    }
  });

  return merged;
}

let projects = buildProjectList();

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

// Dashboard route - serve command center HTML (must be before static middleware)
app.get('/dashboard', (req, res) => {
  if (req.originalUrl === '/dashboard') {
    return res.redirect('/dashboard/');
  }
  res.sendFile(path.join(__dirname, '../client/command-center.html'));
});

// Serve static client files (CSS, JS, assets)
app.use('/dashboard', express.static(path.join(__dirname, '../client'), { redirect: false }));

// Serve the existing portal at root
app.use(express.static(path.join(__dirname, '..')));

// --- API Routes ---

/**
 * GET /api/projects - List all configured projects
 */
app.get('/api/projects', (req, res) => {
  // Re-merge from portal + overrides on each request (picks up projects.js changes)
  projects = buildProjectList();
  res.json(projects);
});

/**
 * POST /api/projects - Create a new project (and optionally clone its repo)
 */
app.post('/api/projects', async (req, res) => {
  try {
    const { name, slug, repo, directory, defaultMode, color, description, cloneRepo } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }

    // Reload current projects from disk
    let currentProjects = [];
    try {
      delete require.cache[require.resolve('../config/projects.json')];
      currentProjects = require('../config/projects.json');
    } catch { currentProjects = []; }

    if (currentProjects.some(p => p.slug === slug)) {
      return res.status(409).json({ error: `Project with slug "${slug}" already exists` });
    }

    const projectDir = directory || `/home/ezdev/projects/${slug}`;

    // Clone the repo if requested
    if (cloneRepo && repo) {
      const repoUrl = repo.includes('github.com')
        ? repo
        : `https://github.com/${repo}.git`;

      const parentDir = path.dirname(projectDir);
      fs.mkdirSync(parentDir, { recursive: true });

      if (fs.existsSync(projectDir)) {
        return res.status(409).json({ error: `Directory already exists: ${projectDir}` });
      }

      await new Promise((resolve, reject) => {
        exec(`git clone ${repoUrl} "${projectDir}"`, { timeout: 120000 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Clone failed: ${stderr || error.message}`));
          } else {
            resolve(stdout);
          }
        });
      });
    }

    const newProject = {
      name,
      slug,
      repo: repo || '',
      directory: projectDir,
      defaultMode: defaultMode || 'normal',
      color: color || '#58a6ff',
      description: description || '',
    };

    currentProjects.push(newProject);
    const configPath = path.join(__dirname, '../config/projects.json');
    fs.writeFileSync(configPath, JSON.stringify(currentProjects, null, 2) + '\n');

    projects = currentProjects;

    io.emit('project:created', newProject);

    res.status(201).json(newProject);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/github/repo/:owner/:repo - Fetch GitHub repo metadata
 */
app.get('/api/github/repo/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      return res.status(response.status).json({ error: 'GitHub API error' });
    }

    const data = await response.json();
    res.json({
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      language: data.language,
      defaultBranch: data.default_branch,
      private: data.private,
    });
  } catch (e) {
    res.status(500).json({ error: `Failed to fetch repo info: ${e.message}` });
  }
});

/**
 * POST /api/sessions/launch - Start a new Claude Code session
 */
app.post('/api/sessions/launch', (req, res) => {
  try {
    const { projectName, slug, repoUrl, workingDirectory, yoloMode, initialPrompt, color } = req.body;
    console.log('[LAUNCH] Request:', { projectName, slug, workingDirectory, yoloMode, initialPrompt: initialPrompt?.slice(0, 50) });

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

    console.log('[LAUNCH] Success:', { id: session.id, windowName: session.windowName, dir: session.workingDirectory });

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
    console.log('[LAUNCH] Error:', e.message);
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
