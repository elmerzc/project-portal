/**
 * Browser Notification handler
 */
class NotificationManager {
  constructor() {
    this.permission = Notification.permission || 'default';
    this.soundEnabled = true;
    this.audioCtx = null;
  }

  /**
   * Request browser notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }
    this.permission = await Notification.showNotification
      ? await Notification.requestPermission()
      : await Notification.requestPermission();
    return this.permission;
  }

  /**
   * Show a browser notification
   */
  show(title, body, options = {}) {
    // Always show toast in dashboard
    this.showToast(title, body, options.icon || 'info');

    // Play sound
    if (this.soundEnabled) {
      this.playNotificationSound();
    }

    // Show browser notification if permitted
    if (this.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: options.icon === 'error' ? undefined : undefined,
          tag: options.tag || `cc-${Date.now()}`,
          requireInteraction: options.requireInteraction || false,
        });

        if (options.onclick) {
          notif.onclick = options.onclick;
        }

        // Auto-close after 5 seconds
        setTimeout(() => notif.close(), 5000);
      } catch {
        // Notification API not available in this context
      }
    }
  }

  /**
   * Show in-app toast notification
   */
  showToast(title, body, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      launch: '&#x1F680;',
      attention: '&#x26A0;',
      error: '&#x274C;',
      completed: '&#x2705;',
      info: '&#x2139;',
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-text">
        <div class="toast-title">${title}</div>
        <div class="toast-body">${body}</div>
      </div>
    `;

    toast.addEventListener('click', () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }
    }, 6000);
  }

  /**
   * Play a notification sound using Web Audio API
   */
  playNotificationSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      oscillator.start(this.audioCtx.currentTime);
      oscillator.stop(this.audioCtx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }
}

// Global instance
const notifManager = new NotificationManager();
