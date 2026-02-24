/**
 * Terminal component using xterm.js for viewing session output
 */
class TerminalManager {
  constructor() {
    this.terminal = null;
    this.currentSessionId = null;
    this.overlay = document.getElementById('terminalOverlay');
    this.container = document.getElementById('terminalContainer');
    this.titleEl = document.getElementById('terminalTitle');
    this.dotEl = document.getElementById('terminalDot');
    this.inputEl = document.getElementById('terminalInput');
    this.sendBtn = document.getElementById('terminalSend');
    this.closeBtn = document.getElementById('terminalClose');
    this.detachBtn = document.getElementById('terminalDetach');

    this._setupEvents();
  }

  _setupEvents() {
    // Close terminal
    this.closeBtn.addEventListener('click', () => this.close());
    this.detachBtn.addEventListener('click', () => this.close());

    // Send input
    this.sendBtn.addEventListener('click', () => this._sendInput());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._sendInput();
      }
    });

    // Escape closes terminal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  /**
   * Open terminal view for a session
   */
  open(sessionId, sessionName, color) {
    this.currentSessionId = sessionId;
    this.titleEl.textContent = sessionName;
    this.dotEl.style.background = color || 'var(--green)';

    // Initialize xterm.js if available
    if (window.Terminal) {
      if (this.terminal) {
        this.terminal.dispose();
      }

      this.terminal = new Terminal({
        theme: {
          background: '#000000',
          foreground: '#e6edf3',
          cursor: '#58a6ff',
          cursorAccent: '#0d1117',
          selectionBackground: '#264f78',
          black: '#0d1117',
          red: '#f85149',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#a371f7',
          cyan: '#56d4dd',
          white: '#e6edf3',
        },
        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 14,
        lineHeight: 1.4,
        cursorBlink: true,
        disableStdin: true,
        scrollback: 5000,
      });

      this.terminal.open(this.container);
      this.terminal.writeln('\x1b[2m--- Connecting to session output... ---\x1b[0m\r\n');
    }

    // Subscribe to terminal data
    ws.attachTerminal(sessionId);

    this.overlay.classList.add('active');
    this.inputEl.focus();
  }

  /**
   * Write data to the terminal
   */
  write(data) {
    if (this.terminal) {
      // Clear and rewrite to show latest output
      this.terminal.clear();
      const lines = data.split('\n');
      lines.forEach(line => {
        this.terminal.writeln(line);
      });
    }
  }

  /**
   * Close the terminal view
   */
  close() {
    ws.detachTerminal();
    this.currentSessionId = null;
    this.overlay.classList.remove('active');

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }

  /**
   * Send input text to the session
   */
  _sendInput() {
    const text = this.inputEl.value.trim();
    if (!text || !this.currentSessionId) return;

    ws.sendTerminalInput(this.currentSessionId, text);
    this.inputEl.value = '';

    // Show what was sent in terminal
    if (this.terminal) {
      this.terminal.writeln(`\r\n\x1b[36m> ${text}\x1b[0m`);
    }
  }
}

// Global instance (initialized after DOM ready)
let termManager;
