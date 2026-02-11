// DOM elements
const cardsGrid = document.getElementById('cardsGrid');
const projectCount = document.getElementById('projectCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalGithub = document.getElementById('modalGithub');
const modalDesc = document.getElementById('modalDesc');
const modalProgressFill = document.getElementById('modalProgressFill');
const modalProgressLabel = document.getElementById('modalProgressLabel');
const modalDone = document.getElementById('modalDone');
const modalPending = document.getElementById('modalPending');
const pendingBtn = document.getElementById('pendingBtn');
const pendingOverlay = document.getElementById('pendingOverlay');
const pendingClose = document.getElementById('pendingClose');
const pendingAllList = document.getElementById('pendingAllList');

// Progress color class
function progressClass(pct) {
  if (pct >= 100) return 'progress-100';
  if (pct >= 80) return 'progress-high';
  if (pct >= 50) return 'progress-mid';
  if (pct >= 25) return 'progress-low';
  return 'progress-minimal';
}

// Render cards
function renderCards() {
  // Sort: in-progress first (by progress desc), then completed
  const sorted = [...PROJECTS].sort((a, b) => {
    if (a.progress === 100 && b.progress !== 100) return 1;
    if (a.progress !== 100 && b.progress === 100) return -1;
    return b.progress - a.progress;
  });

  projectCount.textContent = `${PROJECTS.length} projects`;

  cardsGrid.innerHTML = sorted.map((p, i) => {
    const done = p.features.filter(f => f.done).length;
    const pending = p.features.filter(f => !f.done).length;

    return `
      <div class="card" data-index="${PROJECTS.indexOf(p)}" style="animation-delay: ${i * 0.03}s">
        <div class="card-header">
          <span class="card-name">${p.name}</span>
          <a class="card-github" href="${p.github_url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub</a>
        </div>
        <p class="card-desc">${p.description}</p>
        <div class="card-footer">
          <div class="card-stats">
            <span class="stat-done">${done} done</span>
            <span class="stat-pending">${pending} pending</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${progressClass(p.progress)}" style="width: ${p.progress}%"></div>
          </div>
          <span class="progress-label">${p.progress}%</span>
        </div>
      </div>
    `;
  }).join('');

  // Card click handlers
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      openModal(PROJECTS[idx]);
    });
  });
}

// Open project modal
function openModal(project) {
  modalTitle.textContent = project.name;
  modalGithub.href = project.github_url;
  modalDesc.textContent = project.description;

  modalProgressFill.style.width = project.progress + '%';
  modalProgressFill.className = `progress-fill ${progressClass(project.progress)}`;
  modalProgressLabel.textContent = project.progress + '%';

  const done = project.features.filter(f => f.done);
  const pending = project.features.filter(f => !f.done);

  modalDone.innerHTML = done.map(f => `<li>${f.name}</li>`).join('');
  modalPending.innerHTML = pending.length
    ? pending.map(f => `<li>${f.name}</li>`).join('')
    : '<li style="color: var(--text-muted); background: none;">No pending features</li>';

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Pending features panel
function openPending() {
  const projectsWithPending = PROJECTS
    .filter(p => p.features.some(f => !f.done))
    .sort((a, b) => {
      const aPending = a.features.filter(f => !f.done).length;
      const bPending = b.features.filter(f => !f.done).length;
      return bPending - aPending;
    });

  pendingAllList.innerHTML = projectsWithPending.map(p => {
    const pending = p.features.filter(f => !f.done);
    return `
      <div class="pending-project-group">
        <div class="pending-project-name">${p.name} (${pending.length})</div>
        <ul class="feature-list pending-list">
          ${pending.map(f => `<li>${f.name}</li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');

  pendingOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePending() {
  pendingOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

pendingBtn.addEventListener('click', openPending);
pendingClose.addEventListener('click', closePending);
pendingOverlay.addEventListener('click', (e) => {
  if (e.target === pendingOverlay) closePending();
});

// Escape key closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closePending();
  }
});

// Init
renderCards();
