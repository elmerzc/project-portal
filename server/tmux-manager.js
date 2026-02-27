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

    // Check if session already exists (in-memory check first, then tmux)
    for (const [, s] of this.sessions) {
      if (s.windowName === windowName && s.status !== 'completed') {
        throw new Error(`Session for "${projectName}" is already running`);
      }
    }
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

    // Build the claude command (always interactive — never pipe stdin)
    let claudeCmd = 'claude';
    if (yoloMode) {
      claudeCmd = 'claude --dangerously-skip-permissions';
    }

    // Set working directory and launch
    // Unset CLAUDECODE env var so Claude doesn't think it's a nested session
    const dir = workingDirectory || `/home/ezdev/projects/${slug}`;

    // Use tmux send-keys approach instead of passing command in quotes
    // to avoid shell escaping issues with project names/prompts
    try {
      execSync(`tmux new-window -t ${TMUX_SESSION} -n ${windowName}`);
      execSync(`tmux send-keys -t ${TMUX_SESSION}:${windowName} "unset CLAUDECODE; cd '${dir.replace(/'/g, "'\\''")}' 2>/dev/null || true; ${claudeCmd}" Enter`);
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
      bypassAccepted: false,
    };

    this.sessions.set(id, session);

    // Post-launch: handle YOLO bypass and initial prompt via send-keys.
    // We need to wait for Claude to fully start before sending anything.
    const sendInitialPrompt = () => {
      if (initialPrompt) {
        try {
          // Use tmux load-buffer + paste-buffer to safely send any text
          // This avoids all shell escaping issues with quotes, $, !, etc.
          const tmpFile = `/tmp/claude-prompt-${id}`;
          require('fs').writeFileSync(tmpFile, initialPrompt);
          execSync(`tmux load-buffer -b prompt-buf ${tmpFile}`);
          execSync(`tmux paste-buffer -b prompt-buf -t ${TMUX_SESSION}:${windowName}`);
          execSync(`tmux send-keys -t ${TMUX_SESSION}:${windowName} Enter`);
          try { require('fs').unlinkSync(tmpFile); } catch {}
        } catch { /* window may be gone */ }
      }
    };

    // Wait for Claude to be fully ready (showing input prompt) before sending anything
    const waitForClaude = (callback, attempt = 0) => {
      if (attempt >= 20) return; // give up after ~20s
      try {
        const output = this.captureOutput(windowName, 50);
        if (output.includes('Try "') || output.includes('❯') || output.includes('> ')) {
          callback();
        } else {
          setTimeout(() => waitForClaude(callback, attempt + 1), 1000);
        }
      } catch { /* window may be gone */ }
    };

    if (yoloMode) {
      // Auto-accept the "Bypass Permissions" prompt for YOLO mode sessions.
      // Claude Code shows an interactive TUI selection:
      //   ❯ 1. No, exit
      //     2. Yes, I accept
      // Send Down to move to option 2, wait, then Enter to confirm.
      const acceptBypass = (attempt = 0) => {
        if (attempt >= 15) return;
        try {
          const output = this.captureOutput(windowName, 50);
          if (output.includes('Bypass Permissions') || output.includes('Yes, I accept')) {
            // Send Down arrow, wait 500ms, then send Enter — separately to avoid race
            execSync(`tmux send-keys -t ${TMUX_SESSION}:${windowName} Down`);
            setTimeout(() => {
              try {
                execSync(`tmux send-keys -t ${TMUX_SESSION}:${windowName} Enter`);
                session.bypassAccepted = true;
                // Now wait for Claude to be fully ready, then send initial prompt
                if (initialPrompt) {
                  setTimeout(() => waitForClaude(() => sendInitialPrompt()), 2000);
                }
              } catch { /* window may be gone */ }
            }, 500);
          } else {
            setTimeout(() => acceptBypass(attempt + 1), 1000);
          }
        } catch { /* window may be gone */ }
      };
      setTimeout(() => acceptBypass(), 3000);
    } else if (initialPrompt) {
      // Normal mode: wait for Claude to be ready, then send the initial prompt
      setTimeout(() => waitForClaude(() => sendInitialPrompt()), 3000);
    }

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
   * Send raw tmux keys to a session (for arrow keys, Enter, etc.)
   */
  sendKeys(id, ...keys) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    try {
      execSync(
        `tmux send-keys -t ${TMUX_SESSION}:${session.windowName} ${keys.join(' ')}`
      );
      session.lastActivity = Date.now();
      return { success: true };
    } catch (e) {
      throw new Error(`Failed to send keys: ${e.message}`);
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
