const settings = require('../config/settings.json');

class SessionMonitor {
  constructor(tmuxManager, notificationService) {
    this.tmuxManager = tmuxManager;
    this.notifications = notificationService;
    this.previousStatuses = new Map();
    this.previousOutputs = new Map();
    this.interval = null;
  }

  /**
   * Start monitoring all sessions
   */
  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.poll(), settings.pollInterval);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Poll all sessions for status changes
   */
  poll() {
    const sessions = this.tmuxManager.listAll();

    for (const session of sessions) {
      try {
        // Get fresh status
        const updated = this.tmuxManager.getStatus(session.id);
        const prevStatus = this.previousStatuses.get(session.id);
        const prevOutput = this.previousOutputs.get(session.id) || '';

        // Check for status change
        if (prevStatus && prevStatus !== updated.status) {
          this._onStatusChange(updated, prevStatus);
        }

        // Check for new output (activity detection)
        if (updated.lastOutput !== prevOutput) {
          session.lastActivity = Date.now();
          this._onNewOutput(updated, prevOutput);
        }

        // Store current state
        this.previousStatuses.set(session.id, updated.status);
        this.previousOutputs.set(session.id, updated.lastOutput);
      } catch {
        // Session may have been killed
      }
    }

    // Clean up stale entries
    for (const id of this.previousStatuses.keys()) {
      if (!sessions.find(s => s.id === id)) {
        this.previousStatuses.delete(id);
        this.previousOutputs.delete(id);
      }
    }
  }

  /**
   * Handle status change
   */
  _onStatusChange(session, prevStatus) {
    const { status, projectName, id } = session;

    if (status === 'waiting_for_input' && settings.notifications.waitingForInput) {
      this.notifications.send({
        type: 'attention',
        sessionId: id,
        projectName,
        title: 'Needs Attention',
        body: `${projectName} is waiting for input`,
        icon: 'attention',
      });
    }

    if (status === 'error' && settings.notifications.errors) {
      this.notifications.send({
        type: 'error',
        sessionId: id,
        projectName,
        title: 'Error Detected',
        body: `${projectName} encountered an error`,
        icon: 'error',
      });
    }

    if (status === 'completed' && settings.notifications.completion) {
      this.notifications.send({
        type: 'completed',
        sessionId: id,
        projectName,
        title: 'Session Completed',
        body: `${projectName} session has ended`,
        icon: 'completed',
      });
    }

    // Emit status update via socket.io
    this.notifications.emitStatusUpdate(session);
  }

  /**
   * Handle new output
   */
  _onNewOutput(session, prevOutput) {
    // Emit output update via socket.io
    this.notifications.emitOutputUpdate(session);
  }
}

module.exports = SessionMonitor;
