/**
 * Command Center Dashboard - Main Application
 */

// State
let projects = [];
let sessions = [];
let notifications = [];
let activeView = 'projects';
let projectSearchQuery = '';

// API base URL
const API = '';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  termManager = new TerminalManager();

  // Connect WebSocket
  ws.connect();

  // WebSocket event handlers
  ws.on('connection', onConnectionChange);
  ws.on('init', onInit);
  ws.on('session:launched', onSessionLaunched);
  ws.on('session:killed', onSessionKilled);
  ws.on('session:status', onSessionStatusUpdate);
  ws.on('session:output', onSessionOutputUpdate);
  ws.on('notification', onNotification);
  ws.on('terminal:data', onTerminalData);
  ws.on('project:created', onProjectCreated);

  // Setup navigation
  setupNavigation();
  setupLaunchModal();
  setupNewProjectModal();
  setupProjectDetailModal();
  setupSearch();
  setupKeyboardShortcuts();
  setupNotificationControls();

  // Load initial data via REST API
  fetchProjects();
  fetchSessions();
});

// --- Navigation ---
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  activeView = view;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  document.getElementById(`${view}View`).classList.add('active');

  // Update title
  const titles = {
    projects: 'Projects',
    sessions: 'Active Sessions',
    notifications: 'Notifications',
    settings: 'Settings',
  };
  document.getElementById('pageTitle').textContent = titles[view] || view;

  // Refresh view data
  if (view === 'sessions') fetchSessions();
  if (view === 'notifications') renderNotifications();
  if (view === 'settings') loadSettings();
}

// --- WebSocket Handlers ---
function onConnectionChange({ connected }) {
  const statusEl = document.getElementById('connectionStatus');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('span:last-child');

  dot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  text.textContent = connected ? 'Connected' : 'Disconnected';
}

function onInit(data) {
  if (data.sessions) {
    sessions = data.sessions;
    renderSessions();
    updateSessionsBadge();
  }
  if (data.notifications) {
    notifications = data.notifications;
    renderNotifications();
    updateNotifBadge();
  }
  if (data.projects && data.projects.length > 0) {
    projects = data.projects;
    renderProjects();
  }
}

function onSessionLaunched(session) {
  if (!sessions.find(s => s.id === session.id)) {
    sessions.push(session);
  }
  renderSessions();
  renderProjects();
  updateSessionsBadge();
}

function onSessionKilled({ id }) {
  sessions = sessions.filter(s => s.id !== id);
  renderSessions();
  renderProjects();
  updateSessionsBadge();
}

function onSessionStatusUpdate({ id, status }) {
  const session = sessions.find(s => s.id === id);
  if (session) {
    session.status = status;
    renderSessions();
    renderProjects();
  }
}

function onSessionOutputUpdate({ id, output }) {
  const session = sessions.find(s => s.id === id);
  if (session) {
    session.lastOutput = output;
    // Update output preview if expanded
    const outputBox = document.querySelector(`[data-session-output="${id}"]`);
    if (outputBox) {
      outputBox.textContent = output ? output.trim().split('\n').slice(-20).join('\n') : '(no output)';
      outputBox.scrollTop = outputBox.scrollHeight;
    }
  }
}

function onNotification(notif) {
  notifications.unshift(notif);
  updateNotifBadge();
  renderNotifications();

  // Show browser notification
  notifManager.show(notif.title, notif.body, {
    icon: notif.icon || notif.type,
    tag: notif.id,
  });
}

function onTerminalData({ sessionId, data }) {
  if (termManager.currentSessionId === sessionId) {
    termManager.write(data);
  }
}

function onProjectCreated(project) {
  if (!projects.some(p => p.slug === project.slug)) {
    projects.push(project);
    renderProjects();
  }
  notifManager.showToast('Project Added', `${project.name} has been added`, 'info');
}

// --- Data Fetching ---
async function fetchProjects() {
  try {
    const res = await fetch(`${API}/api/projects`);
    if (res.ok) {
      projects = await res.json();
      renderProjects();
    }
  } catch {
    // Use cached projects
  }
}

async function fetchSessions() {
  try {
    const res = await fetch(`${API}/api/sessions`);
    if (res.ok) {
      sessions = await res.json();
      renderSessions();
      renderProjects();
      updateSessionsBadge();
    }
  } catch {
    // Will retry via WebSocket
  }
}

// --- Project Rendering ---
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');

  let filtered = [...projects];
  if (projectSearchQuery) {
    const q = projectSearchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = filtered.map((p, i) => {
    const session = sessions.find(s => s.slug === p.slug && s.status !== 'completed');
    const statusHTML = session ? `
      <span class="project-session-status status-${session.status}">
        <span class="status-dot ${session.status === 'running' ? 'connected status-dot-pulse' : ''}"
              style="width:6px;height:6px;background:currentColor"></span>
        ${formatStatus(session.status)}
      </span>` : '';

    const progressHTML = p.progress !== undefined ? `
        <div class="project-progress-row">
          <div class="project-progress-bar">
            <div class="project-progress-fill ${getProgressClass(p.progress)}" style="width: ${p.progress}%"></div>
          </div>
          <span class="project-progress-label">${p.progress}%</span>
        </div>` : '';

    const categoryHTML = p.category ? `<span class="project-category-tag" style="color:${p.color};background:${p.color}18;border:1px solid ${p.color}40">${p.category}</span>` : '';

    return `
      <div class="project-card" data-project-idx="${i}" style="animation-delay: ${i * 0.04}s; border-left: 3px solid ${p.color}; cursor: pointer;">
        <div class="project-card-header">
          <div>
            <div class="project-name">${p.name}</div>
            <div class="project-repo">${p.repo} ${categoryHTML}</div>
          </div>
          ${statusHTML}
        </div>
        <div class="project-desc">${p.description}</div>
        ${progressHTML}
        <div class="project-actions">
          ${p.github_url || p.repo ? `<a class="btn btn-sm btn-outline" href="${p.github_url || 'https://github.com/' + p.repo}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub</a>` : ''}
          ${session
            ? `<button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); openTerminalForSession('${session.id}', '${escAttr(p.name)}', '${p.color}')">View Output</button>
               <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); killSession('${session.id}')">Stop</button>`
            : `<button class="btn btn-sm btn-accent" onclick="event.stopPropagation(); openLaunchModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">Launch Claude Code</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  // Make cards clickable to open detail modal
  grid.querySelectorAll('.project-card[data-project-idx]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking a button inside the card
      if (e.target.closest('button') || e.target.closest('a')) return;
      const idx = parseInt(card.dataset.projectIdx);
      openProjectDetail(filtered[idx]);
    });
  });
}

function formatStatus(status) {
  const labels = {
    running: 'Running',
    waiting_for_input: 'Needs Input',
    idle: 'Idle',
    error: 'Error',
    completed: 'Completed',
  };
  return labels[status] || status;
}

function escAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getProgressClass(progress) {
  if (progress >= 100) return 'progress-100';
  if (progress >= 75) return 'progress-high';
  if (progress >= 50) return 'progress-mid';
  if (progress >= 25) return 'progress-low';
  return 'progress-minimal';
}

// --- Session Rendering ---
function renderSessions() {
  const list = document.getElementById('sessionsList');
  const empty = document.getElementById('sessionsEmpty');

  const active = sessions.filter(s => s.status !== 'completed');

  if (active.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = active.map(s => {
    const startTime = new Date(s.startedAt).toLocaleTimeString();
    return `
      <div class="session-card ${s.yoloMode ? 'yolo' : ''}">
        <div class="session-card-header">
          <div class="session-info">
            <div class="session-color-dot" style="background: ${s.color}"></div>
            <div class="session-details">
              <div class="session-name">${s.projectName}</div>
              <div class="session-meta">
                <span class="project-session-status status-${s.status}" style="padding:2px 8px">
                  ${formatStatus(s.status)}
                </span>
                ${s.yoloMode ? '<span class="yolo-badge">YOLO</span>' : ''}
                <span>Started ${startTime}</span>
              </div>
            </div>
          </div>
          <div class="session-actions">
            <button class="btn btn-sm btn-outline" onclick="toggleOutput('${s.id}')">Output</button>
            <button class="btn btn-sm btn-outline" onclick="openTerminalForSession('${s.id}', '${escAttr(s.projectName)}', '${s.color}')">Terminal</button>
            <button class="btn btn-sm btn-danger" onclick="killSession('${s.id}')">Stop</button>
          </div>
        </div>
        <div class="session-output-preview" id="output-${s.id}">
          <div class="output-box" data-session-output="${s.id}">${s.lastOutput ? s.lastOutput.trim().split('\n').slice(-20).join('\n') : '(no output yet)'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function updateSessionsBadge() {
  const badge = document.getElementById('sessionsBadge');
  const active = sessions.filter(s => s.status !== 'completed').length;
  badge.textContent = active > 0 ? active : '';
}

// --- Session Actions ---
function toggleOutput(sessionId) {
  const el = document.getElementById(`output-${sessionId}`);
  if (el) {
    el.classList.toggle('expanded');
    // Fetch fresh output when expanding
    if (el.classList.contains('expanded')) {
      fetchSessionOutput(sessionId);
    }
  }
}

async function fetchSessionOutput(sessionId) {
  try {
    const res = await fetch(`${API}/api/sessions/${sessionId}/output`);
    if (res.ok) {
      const data = await res.json();
      const outputBox = document.querySelector(`[data-session-output="${sessionId}"]`);
      if (outputBox) {
        outputBox.textContent = data.output ? data.output.trim().split('\n').slice(-20).join('\n') : '(no output)';
        outputBox.scrollTop = outputBox.scrollHeight;
      }
    }
  } catch { /* ignore */ }
}

async function killSession(sessionId) {
  if (!confirm('Stop this Claude Code session?')) return;

  try {
    const res = await fetch(`${API}/api/sessions/${sessionId}`, { method: 'DELETE' });
    if (res.ok) {
      sessions = sessions.filter(s => s.id !== sessionId);
      renderSessions();
      renderProjects();
      updateSessionsBadge();
    } else {
      const data = await res.json();
      notifManager.showToast('Error', data.error || 'Failed to stop session', 'error');
    }
  } catch (e) {
    notifManager.showToast('Error', 'Failed to stop session', 'error');
  }
}

function openTerminalForSession(sessionId, name, color) {
  termManager.open(sessionId, name, color);
}

// --- Launch Modal ---
function setupLaunchModal() {
  const overlay = document.getElementById('launchOverlay');
  const closeBtn = document.getElementById('launchClose');
  const form = document.getElementById('launchForm');
  const modeRadios = document.querySelectorAll('input[name="launchMode"]');
  const yoloWarning = document.getElementById('yoloWarning');

  closeBtn.addEventListener('click', closeLaunchModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLaunchModal();
  });

  // Toggle YOLO warning
  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      yoloWarning.style.display = radio.value === 'yolo' && radio.checked ? 'flex' : 'none';
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-launch');
    btn.disabled = true;
    btn.textContent = 'Launching...';

    const mode = form.querySelector('input[name="launchMode"]:checked').value;
    const yolo = mode === 'yolo';

    // Confirm YOLO mode
    if (yolo && !confirm('YOLO mode skips ALL permission prompts. Claude Code will execute commands without asking.\n\nAre you sure?')) {
      btn.disabled = false;
      btn.textContent = 'Launch Session';
      return;
    }

    try {
      const res = await fetch(`${API}/api/sessions/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: document.getElementById('launchName').value,
          slug: document.getElementById('launchSlug').value,
          repoUrl: document.getElementById('launchRepo').value,
          workingDirectory: document.getElementById('launchDir').value,
          yoloMode: yolo,
          initialPrompt: document.getElementById('launchPrompt').value.trim(),
          color: document.getElementById('launchColor').value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Launch failed');
      }

      // Add session immediately from POST response (don't wait for WebSocket)
      if (!sessions.find(s => s.id === data.id)) {
        sessions.push(data);
      }

      closeLaunchModal();
      notifManager.showToast('Launched', `${data.projectName} session started`, 'launch');

      // Switch to sessions view and render
      renderSessions();
      updateSessionsBadge();
      switchView('sessions');
    } catch (err) {
      notifManager.showToast('Launch Failed', err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Launch Session';
    }
  });
}

function openLaunchModal(project) {
  document.getElementById('launchName').value = project.name;
  document.getElementById('launchSlug').value = project.slug;
  document.getElementById('launchRepo').value = project.repo || '';
  document.getElementById('launchDir').value = project.directory || '';
  document.getElementById('launchColor').value = project.color || '#58a6ff';
  document.getElementById('launchProjectName').textContent = project.name;
  document.getElementById('launchPrompt').value = '';

  // Reset mode to normal
  document.querySelector('input[name="launchMode"][value="normal"]').checked = true;
  document.getElementById('yoloWarning').style.display = 'none';

  document.getElementById('launchOverlay').classList.add('active');
  document.getElementById('launchPrompt').focus();
}

function closeLaunchModal() {
  document.getElementById('launchOverlay').classList.remove('active');
}

// --- Notifications ---
function renderNotifications() {
  const list = document.getElementById('notificationsList');
  const empty = document.getElementById('notifsEmpty');
  const countEl = document.getElementById('notifCount');

  if (notifications.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    countEl.textContent = '0 notifications';
    return;
  }

  empty.style.display = 'none';
  countEl.textContent = `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`;

  list.innerHTML = notifications.map(n => {
    const icons = {
      launch: '&#x1F680;',
      attention: '&#x26A0;',
      error: '&#x274C;',
      completed: '&#x2705;',
      launched: '&#x1F680;',
    };
    const time = new Date(n.timestamp).toLocaleTimeString();

    return `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-icon ${n.type || n.icon}">${icons[n.type] || icons[n.icon] || '&#x2139;'}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-body">${n.body}</div>
        </div>
        <span class="notif-time">${time}</span>
      </div>
    `;
  }).join('');
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  const unread = notifications.filter(n => !n.read).length;
  badge.textContent = unread > 0 ? unread : '';
}

function setupNotificationControls() {
  // Mark all read
  document.getElementById('markAllReadBtn').addEventListener('click', async () => {
    try {
      await fetch(`${API}/api/notifications/read`, { method: 'POST' });
      notifications.forEach(n => { n.read = true; });
      renderNotifications();
      updateNotifBadge();
    } catch { /* ignore */ }
  });

  // Request browser notification permission
  document.getElementById('requestNotifPermission').addEventListener('click', async () => {
    const perm = await notifManager.requestPermission();
    const btn = document.getElementById('requestNotifPermission');
    btn.textContent = perm === 'granted' ? 'Enabled' : 'Denied';
    btn.disabled = perm !== 'default';
  });
}

// --- Settings ---
function loadSettings() {
  fetch(`${API}/api/settings`)
    .then(r => r.json())
    .then(settings => {
      document.getElementById('settingPort').textContent = settings.port;
      document.getElementById('settingTmux').textContent = settings.tmuxSession;
      document.getElementById('settingMax').textContent = settings.maxSessions;
      document.getElementById('settingPoll').textContent = settings.pollInterval + 'ms';

      document.getElementById('settingSound').checked = settings.notifications.sound;
      document.getElementById('settingWaiting').checked = settings.notifications.waitingForInput;
      document.getElementById('settingErrors').checked = settings.notifications.errors;
      document.getElementById('settingComplete').checked = settings.notifications.completion;
    })
    .catch(() => {});

  // Update notification permission button
  const btn = document.getElementById('requestNotifPermission');
  if (Notification.permission === 'granted') {
    btn.textContent = 'Enabled';
  } else if (Notification.permission === 'denied') {
    btn.textContent = 'Denied';
    btn.disabled = true;
  }
}

// --- Search ---
function setupSearch() {
  const input = document.getElementById('projectSearch');
  input.addEventListener('input', (e) => {
    projectSearchQuery = e.target.value;
    renderProjects();
  });
}

// --- Keyboard Shortcuts ---
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
      closeLaunchModal();
      closeProjectDetail();
      document.getElementById('newProjectOverlay').classList.remove('active');
    }

    // Don't handle shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Cmd/Ctrl + number to switch views
    if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const views = ['projects', 'sessions', 'notifications', 'settings'];
      switchView(views[parseInt(e.key) - 1]);
    }

    // / to focus search
    if (e.key === '/' && activeView === 'projects') {
      e.preventDefault();
      document.getElementById('projectSearch').focus();
    }
  });
}

// --- New Project Modal ---
function setupNewProjectModal() {
  const overlay = document.getElementById('newProjectOverlay');
  const closeBtn = document.getElementById('newProjectClose');
  const cancelBtn = document.getElementById('newProjectCancel');
  const form = document.getElementById('newProjectForm');
  const fetchBtn = document.getElementById('fetchGithubBtn');
  const urlInput = document.getElementById('githubUrlInput');
  const statusHint = document.getElementById('githubFetchStatus');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const cloneGroup = document.getElementById('cloneCheckboxGroup');
  let currentTab = 'github';

  // Open modal
  document.getElementById('newProjectBtn').addEventListener('click', () => {
    resetNewProjectForm();
    overlay.classList.add('active');
    if (currentTab === 'github') {
      urlInput.focus();
    } else {
      document.getElementById('npName').focus();
    }
  });

  // Close modal
  function closeModal() {
    overlay.classList.remove('active');
  }
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      if (currentTab === 'github') {
        document.getElementById('githubTab').classList.add('active');
        cloneGroup.style.display = '';
      } else {
        cloneGroup.style.display = 'none';
      }
    });
  });

  // Auto-generate slug from name
  document.getElementById('npName').addEventListener('input', (e) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    document.getElementById('npSlug').value = slug;
    document.getElementById('npDirectory').placeholder = `/home/user/projects/${slug || 'my-project'}`;
  });

  // Color preview
  document.getElementById('npColor').addEventListener('input', (e) => {
    document.getElementById('npColorPreview').style.background = e.target.value;
  });

  // Fetch GitHub repo metadata
  fetchBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      statusHint.textContent = 'Please enter a GitHub URL';
      statusHint.className = 'form-hint error';
      return;
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      statusHint.textContent = 'Invalid GitHub URL. Use https://github.com/owner/repo or owner/repo';
      statusHint.className = 'form-hint error';
      return;
    }

    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching...';
    statusHint.textContent = '';

    try {
      const res = await fetch(`${API}/api/github/repo/${parsed.owner}/${parsed.repo}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      document.getElementById('npName').value = formatRepoName(data.name);
      document.getElementById('npSlug').value = data.name;
      document.getElementById('npRepo').value = data.fullName;
      document.getElementById('npDescription').value = data.description || '';
      document.getElementById('npDirectory').value = `/home/user/projects/${data.name}`;

      statusHint.textContent = `Found: ${data.fullName}${data.private ? ' (private)' : ''}`;
      statusHint.className = 'form-hint success';
    } catch (err) {
      statusHint.textContent = err.message;
      statusHint.className = 'form-hint error';
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch';
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('newProjectSubmit');
    submitBtn.disabled = true;

    const cloneRepo = currentTab === 'github'
      && document.getElementById('npCloneRepo').checked;

    const isCloning = cloneRepo && document.getElementById('npRepo').value;
    submitBtn.textContent = isCloning ? 'Cloning & Adding...' : 'Adding...';

    const body = {
      name: document.getElementById('npName').value.trim(),
      slug: document.getElementById('npSlug').value.trim(),
      repo: document.getElementById('npRepo').value.trim(),
      directory: document.getElementById('npDirectory').value.trim() || undefined,
      description: document.getElementById('npDescription').value.trim(),
      color: document.getElementById('npColor').value,
      defaultMode: document.getElementById('npDefaultMode').value,
      cloneRepo: cloneRepo,
    };

    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add project');
      }

      closeModal();
      if (!projects.some(p => p.slug === data.slug)) {
        projects.push(data);
        renderProjects();
      }
      notifManager.showToast('Project Added', `${data.name} has been added to the dashboard`, 'launch');
    } catch (err) {
      notifManager.showToast('Error', err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Project';
    }
  });
}

function parseGitHubUrl(input) {
  const shortMatch = input.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }
  const urlMatch = input.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }
  return null;
}

function formatRepoName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// === PROJECT DETAIL MODAL ===
const STORAGE_KEY = 'project-portal-suggestions';
let currentDetailProject = null;

function getSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveSuggestions(suggestions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
}

function openProjectDetail(project) {
  currentDetailProject = project;
  const overlay = document.getElementById('projectDetailOverlay');

  document.getElementById('detailTitle').textContent = project.name;
  document.getElementById('detailDesc').textContent = project.description;

  // Category tag
  const catTag = document.getElementById('detailCategory');
  if (project.category) {
    catTag.textContent = project.category;
    catTag.style.color = project.color;
    catTag.style.background = project.color + '18';
    catTag.style.border = `1px solid ${project.color}40`;
    catTag.style.display = '';
  } else {
    catTag.style.display = 'none';
  }

  // GitHub link
  const ghLink = document.getElementById('detailGithub');
  if (project.github_url || project.repo) {
    ghLink.href = project.github_url || `https://github.com/${project.repo}`;
    ghLink.style.display = '';
  } else {
    ghLink.style.display = 'none';
  }

  // Progress
  const fill = document.getElementById('detailProgressFill');
  const label = document.getElementById('detailProgressLabel');
  const progress = project.progress || 0;
  fill.style.width = progress + '%';
  fill.className = `project-progress-fill ${getProgressClass(progress)}`;
  label.textContent = progress + '%';

  // Launch button in detail
  const actionsEl = document.getElementById('detailActions');
  const session = sessions.find(s => s.slug === project.slug && s.status !== 'completed');
  if (session) {
    actionsEl.innerHTML = `
      <button class="btn btn-sm btn-outline" onclick="openTerminalForSession('${session.id}', '${escAttr(project.name)}', '${project.color}')">View Output</button>
      <button class="btn btn-sm btn-danger" onclick="killSession('${session.id}')">Stop Session</button>`;
  } else {
    actionsEl.innerHTML = `<button class="btn btn-sm btn-accent" onclick="closeProjectDetail(); openLaunchModal(${JSON.stringify(project).replace(/"/g, '&quot;')})">Launch Claude Code</button>`;
  }

  // Features
  const features = project.features || [];
  const done = features.filter(f => f.done);
  const pending = features.filter(f => !f.done);

  document.getElementById('detailDone').innerHTML = done.length
    ? done.map(f => `<li>${f.name}</li>`).join('')
    : '<li style="color:var(--text-muted);background:none">No completed features</li>';

  document.getElementById('detailPending').innerHTML = pending.length
    ? pending.map(f => `<li>${f.name}</li>`).join('')
    : '<li style="color:var(--text-muted);background:none">No pending features</li>';

  // Suggestions
  renderDetailSuggestions(project.name);

  overlay.classList.add('active');
}

function renderDetailSuggestions(projectName) {
  const suggestions = getSuggestions().filter(s => s.project === projectName);
  const section = document.getElementById('detailSuggestionsSection');
  const list = document.getElementById('detailSuggestions');

  if (suggestions.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  list.innerHTML = suggestions.map(s => {
    const priorityTag = `<span class="suggestion-priority-tag priority-tag-${s.priority}">${s.priority}</span>`;
    return `<li>${s.text}${priorityTag}<button class="suggestion-delete-btn" data-id="${s.id}">&times;</button></li>`;
  }).join('');

  // Delete handlers
  list.querySelectorAll('.suggestion-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = getSuggestions().filter(s => s.id !== btn.dataset.id);
      saveSuggestions(updated);
      renderDetailSuggestions(projectName);
    });
  });
}

function closeProjectDetail() {
  document.getElementById('projectDetailOverlay').classList.remove('active');
  currentDetailProject = null;
}

function setupProjectDetailModal() {
  const overlay = document.getElementById('projectDetailOverlay');
  const closeBtn = document.getElementById('projectDetailClose');

  closeBtn.addEventListener('click', closeProjectDetail);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProjectDetail();
  });

  // Add suggestion inline
  document.getElementById('detailIdeaAdd').addEventListener('click', () => {
    const input = document.getElementById('detailIdeaInput');
    const priority = document.getElementById('detailIdeaPriority');
    const text = input.value.trim();
    if (!text || !currentDetailProject) return;

    const suggestions = getSuggestions();
    suggestions.push({
      id: Date.now().toString(),
      project: currentDetailProject.name,
      text,
      priority: priority.value,
      createdAt: new Date().toISOString(),
    });
    saveSuggestions(suggestions);

    input.value = '';
    priority.value = 'low';
    renderDetailSuggestions(currentDetailProject.name);
    notifManager.showToast('Suggestion Added', `Added to ${currentDetailProject.name}`, 'info');
  });

  // Enter key to add
  document.getElementById('detailIdeaInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('detailIdeaAdd').click();
    }
  });
}

function resetNewProjectForm() {
  document.getElementById('newProjectForm').reset();
  document.getElementById('githubUrlInput').value = '';
  document.getElementById('githubFetchStatus').textContent = '';
  document.getElementById('githubFetchStatus').className = 'form-hint';
  document.getElementById('npColor').value = '#58a6ff';
  document.getElementById('npColorPreview').style.background = '#58a6ff';
  document.getElementById('npDirectory').placeholder = '/home/user/projects/my-project';
  document.getElementById('newProjectSubmit').textContent = 'Add Project';
  document.getElementById('newProjectSubmit').disabled = false;
}
