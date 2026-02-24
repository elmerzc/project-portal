/**
 * WebSocket connection manager using socket.io
 */
class WSClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
  }

  /**
   * Connect to the Command Center server
   */
  connect() {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'https:' ? 443 : 80);

    this.socket = io(`${protocol}//${host}:${port}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this._emit('connection', { connected: true });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this._emit('connection', { connected: false });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
    });

    // Forward server events
    this.socket.on('init', (data) => this._emit('init', data));
    this.socket.on('session:launched', (data) => this._emit('session:launched', data));
    this.socket.on('session:killed', (data) => this._emit('session:killed', data));
    this.socket.on('session:status', (data) => this._emit('session:status', data));
    this.socket.on('session:output', (data) => this._emit('session:output', data));
    this.socket.on('notification', (data) => this._emit('notification', data));
    this.socket.on('terminal:data', (data) => this._emit('terminal:data', data));
    this.socket.on('terminal:error', (data) => this._emit('terminal:error', data));
    this.socket.on('project:created', (data) => this._emit('project:created', data));
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const cbs = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, cbs);
    }
  }

  /**
   * Emit to internal listeners
   */
  _emit(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => cb(data));
  }

  /**
   * Send terminal attach request
   */
  attachTerminal(sessionId) {
    if (this.socket) {
      this.socket.emit('terminal:attach', sessionId);
    }
  }

  /**
   * Send terminal input
   */
  sendTerminalInput(sessionId, text) {
    if (this.socket) {
      this.socket.emit('terminal:input', { sessionId, text });
    }
  }

  /**
   * Detach terminal
   */
  detachTerminal() {
    if (this.socket) {
      this.socket.emit('terminal:detach');
    }
  }

  /**
   * Send session input
   */
  sendInput(sessionId, text) {
    if (this.socket) {
      this.socket.emit('session:input', { sessionId, text });
    }
  }
}

// Global instance
const ws = new WSClient();
