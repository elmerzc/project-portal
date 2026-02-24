const { execSync, spawn } = require('child_process');
const path = require('path');
const settings = require('../config/settings.json');

const TMUX_SESSION = settings.tmuxSession;

class TmuxManager {
  constructor() {
    this.sessions = new Map();
    this._ensureTmuxSession();
  }

  /**
   * Ensure the main tmux session exists
   */
  _ensureTmuxSession() {
    try {
      execSync(`tmux has-session -t ${TMUX_SESSION} 2>/dev/null`);
    } catch {
      // Create detached tmux session
      execSync(`tmux new-session -d -s ${TMUX_SESSION} -n main`);
    }
  }

  /**
   * Generate a unique session ID
   */
  _generateId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Sanitize window name for tmux (no dots or colons)
   */
  _windowName(slug) {
    return `claude-${slug}`.replace(/[.:]/g, '-');
  }

  /**
   * Launch a new Claude Code session in a tmux window
   */
  launch({ projectName, slug, repoUrl, workingDirectory, yoloMode, initialPrompt, color }) {
    const id = this._generateId();
    const windowName = this._windowName(slug || projectName.toLowerCase().replace(/\s+/g, '-'));

    // Check if window already exists
    try {
      const existing = execSync(
        `tmux list-windows -t ${TMUX_SESSION} -F "#{window_name}"`,
        { encoding: 'utf-8' }
      );
      if (existing.split('\n').includes(windowName)) {
        throw new Error(`Session for "${projectName}" is already running`);
      }
    } catch (e) {
      if (e.message.includes('already running')) throw e;
    }

    // Check max sessions
    if (this.sessions.size >= settings.maxSessions) {
      throw new Error(`Maximum sessions (${settings.maxSessions}) reached. Stop a session first.`);
    }

    // Build the claude command
    let claudeCmd = 'claude';
    if (yoloMode) {
      claudeCmd = 'claude --dangerously-skip-permissions';
    }

    // If there's an initial prompt, pipe it
    if (initialPrompt) {
      // Escape single quotes in the prompt
      const escaped = initialPrompt.replace(/'/g, "'\\''");
      claudeCmd = `echo '${escaped}' | ${claudeCmd}`;
    }

    // Set working directory and launch
    const dir = workingDirectory || `/home/user/projects/${slug}`;
    const fullCmd = `cd '${dir}' 2>/dev/null || true; ${claudeCmd}`;

    try {
      execSync(
        `tmux new-window -t ${TMUX_SESSION} -n '${windowName}' '${fullCmd.replace(/'/g, "'\\''")}'`
      );
    } catch (e) {
      throw new Error(`Failed to launch session: ${e.message}`);
    }

    const session = {
      id,
      windowName,
      projectName,
      slug: slug || projectName.toLowerCase().replace(/\s+/g, '-'),
      repoUrl: repoUrl || '',
      workingDirectory: dir,
      yoloMode: !!yoloMode,
      initialPrompt: initialPrompt || '',
      color: color || '#58a6ff',
      status: 'running',
      startedAt: new Date().toISOString(),
      lastOutput: '',
      lastActivity: Date.now(),
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Kill a session by ID
   */
  kill(id) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    try {
      execSync(`tmux kill-window -t ${TMUX_SESSION}:${session.windowName} 2>/dev/null`);
    } catch {
      // Window may already be gone
    }

    this.sessions.delete(id);
    return { success: true, id };
  }

  /**
   * Get all active sessions with their current status
   */
  listAll() {
    // Also check for windows that may have been killed externally
    let tmuxWindows = [];
    try {
      const output = execSync(
        `tmux list-windows -t ${TMUX_SESSION} -F "#{window_name}" 2>/dev/null`,
        { encoding: 'utf-8' }
      );
      tmuxWindows = output.trim().split('\n').filter(Boolean);
    } catch {
      tmuxWindows = [];
    }

    // Mark sessions as completed if their tmux window is gone
    for (const [id, session] of this.sessions) {
      if (!tmuxWindows.includes(session.windowName)) {
        session.status = 'completed';
      }
    }

    return Array.from(this.sessions.values());
  }

  /**
   * Get detailed status of one session
   */
  getStatus(id) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    // Capture current pane output
    const output = this.captureOutput(session.windowName);
    session.lastOutput = output;

    // Detect status from output
    session.status = this._detectStatus(output, session);

    return session;
  }

  /**
   * Capture tmux pane output for a window
   */
  captureOutput(windowName, lines = 100) {
    try {
      return execSync(
        `tmux capture-pane -t ${TMUX_SESSION}:${windowName} -p -S -${lines} 2>/dev/null`,
        { encoding: 'utf-8' }
      );
    } catch {
      return '';
    }
  }

  /**
   * Send input to a session
   */
  sendInput(id, text) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    try {
      // Send keys to the tmux pane
      const escaped = text.replace(/"/g, '\\"');
      execSync(
        `tmux send-keys -t ${TMUX_SESSION}:${session.windowName} "${escaped}" Enter`
      );
      session.lastActivity = Date.now();
      return { success: true };
    } catch (e) {
      throw new Error(`Failed to send input: ${e.message}`);
    }
  }

  /**
   * Detect session status from pane output
   */
  _detectStatus(output, session) {
    if (!output || output.trim() === '') {
      // Check if window still exists
      try {
        execSync(`tmux list-windows -t ${TMUX_SESSION} -F "#{window_name}" 2>/dev/null`, { encoding: 'utf-8' });
        const windows = execSync(
          `tmux list-windows -t ${TMUX_SESSION} -F "#{window_name}"`,
          { encoding: 'utf-8' }
        );
        if (!windows.includes(session.windowName)) {
          return 'completed';
        }
      } catch {
        return 'completed';
      }
      return 'idle';
    }

    const lastLines = output.trim().split('\n').slice(-10).join('\n').toLowerCase();

    // Check for error patterns
    if (lastLines.match(/error:|exception:|traceback|failed|fatal/i)) {
      return 'error';
    }

    // Check for input prompts (Y/n, questions, etc.)
    if (lastLines.match(/\(y\/n\)|\(yes\/no\)|(\?\s*$)|do you want|would you like|please confirm|enter .* to continue/i)) {
      return 'waiting_for_input';
    }

    // Check for Claude-specific prompts
    if (lastLines.match(/>\s*$|❯\s*$/)) {
      return 'waiting_for_input';
    }

    // Check idle (no change in a while)
    const timeSinceActivity = Date.now() - session.lastActivity;
    if (timeSinceActivity > 30000) {
      return 'idle';
    }

    return 'running';
  }

  /**
   * Spawn a node-pty process attached to a tmux pane (for xterm.js)
   */
  attachPty(id) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    // Use tmux attach to a specific pane
    const pty = spawn('tmux', [
      'attach-session', '-t', `${TMUX_SESSION}:${session.windowName}`
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return pty;
  }
}

module.exports = TmuxManager;
