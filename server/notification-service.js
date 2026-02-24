class NotificationService {
  constructor() {
    this.io = null;
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * Set the socket.io instance
   */
  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Send a notification to all connected clients
   */
  send(notification) {
    const entry = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    if (this.io) {
      this.io.emit('notification', entry);
    }

    return entry;
  }

  /**
   * Emit session status update
   */
  emitStatusUpdate(session) {
    if (this.io) {
      this.io.emit('session:status', {
        id: session.id,
        status: session.status,
        projectName: session.projectName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit session output update
   */
  emitOutputUpdate(session) {
    if (this.io) {
      this.io.emit('session:output', {
        id: session.id,
        output: session.lastOutput,
        projectName: session.projectName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get notification history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Mark a notification as read
   */
  markRead(notifId) {
    const notif = this.history.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllRead() {
    this.history.forEach(n => { n.read = true; });
  }

  /**
   * Get unread count
   */
  unreadCount() {
    return this.history.filter(n => !n.read).length;
  }
}

module.exports = NotificationService;
