// State
let activeCategory = null;
let searchQuery = '';
let sortMode = 'progress';
let githubDates = {};

// DOM elements
const cardsGrid = document.getElementById('cardsGrid');
const projectCount = document.getElementById('projectCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalGithub = document.getElementById('modalGithub');
const modalDesc = document.getElementById('modalDesc');
const modalMeta = document.getElementById('modalMeta');
const modalCategory = document.getElementById('modalCategory');
const modalProgressFill = document.getElementById('modalProgressFill');
const modalProgressLabel = document.getElementById('modalProgressLabel');
const modalDone = document.getElementById('modalDone');
const modalPending = document.getElementById('modalPending');
const pendingBtn = document.getElementById('pendingBtn');
const pendingOverlay = document.getElementById('pendingOverlay');
const pendingClose = document.getElementById('pendingClose');
const pendingAllList = document.getElementById('pendingAllList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categoryFilters = document.getElementById('categoryFilters');
const noResults = document.getElementById('noResults');

// Stats elements
const statProjects = document.getElementById('statProjects');
const statDone = document.getElementById('statDone');
const statPending = document.getElementById('statPending');
const statAvg = document.getElementById('statAvg');
const overallFill = document.getElementById('overallFill');

// Progress color class
function progressClass(pct) {
  if (pct >= 100) return 'progress-100';
  if (pct >= 80) return 'progress-high';
  if (pct >= 50) return 'progress-mid';
  if (pct >= 25) return 'progress-low';
  return 'progress-minimal';
}

// Category tag HTML
function categoryTag(catKey) {
  const cat = CATEGORIES[catKey];
  if (!cat) return '';
  return `<span class="category-tag" style="background:${cat.color}22; color:${cat.color}; border:1px solid ${cat.color}44">${cat.label}</span>`;
}

// Time ago helper
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Compute & render stats
function renderStats() {
  const totalFeatures = PROJECTS.reduce((sum, p) => sum + p.features.length, 0);
  const totalDone = PROJECTS.reduce((sum, p) => sum + p.features.filter(f => f.done).length, 0);
  const totalPending = totalFeatures - totalDone;
  const avgProgress = Math.round(PROJECTS.reduce((sum, p) => sum + p.progress, 0) / PROJECTS.length);

  statProjects.textContent = PROJECTS.length;
  statDone.textContent = totalDone;
  statPending.textContent = totalPending;
  statAvg.textContent = avgProgress + '%';
  overallFill.style.width = avgProgress + '%';
}

// Build category filter buttons
function renderCategoryFilters() {
  const allBtn = `<button class="cat-btn ${!activeCategory ? 'active' : ''}" data-cat="all" style="${!activeCategory ? 'background:var(--accent);color:var(--bg)' : ''}">All</button>`;
  const catBtns = Object.entries(CATEGORIES).map(([key, cat]) => {
    const isActive = activeCategory === key;
    const style = isActive ? `background:${cat.color};color:var(--bg)` : '';
    return `<button class="cat-btn ${isActive ? 'active' : ''}" data-cat="${key}" style="${style}">${cat.label}</button>`;
  }).join('');
  categoryFilters.innerHTML = allBtn + catBtns;

  categoryFilters.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat === 'all' ? null : btn.dataset.cat;
      renderCategoryFilters();
      renderCards();
    });
  });
}

// Filter & sort
function getFilteredProjects() {
  let filtered = [...PROJECTS];

  // Category filter
  if (activeCategory) {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.features.some(f => f.name.toLowerCase().includes(q))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortMode === 'updated') {
      const dateA = githubDates[a.github_repo] || '';
      const dateB = githubDates[b.github_repo] || '';
      return dateB.localeCompare(dateA);
    }
    // Default: progress (in-progress first, then completed)
    if (a.progress === 100 && b.progress !== 100) return 1;
    if (a.progress !== 100 && b.progress === 100) return -1;
    return b.progress - a.progress;
  });

  return filtered;
}

// Render cards
function renderCards() {
  const filtered = getFilteredProjects();

  projectCount.textContent = `${filtered.length} of ${PROJECTS.length} projects`;

  if (filtered.length === 0) {
    cardsGrid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  cardsGrid.innerHTML = filtered.map((p, i) => {
    const done = p.features.filter(f => f.done).length;
    const pending = p.features.filter(f => !f.done).length;
    const updatedDate = githubDates[p.github_repo];
    const updatedText = updatedDate ? `Updated ${timeAgo(updatedDate)}` : '';

    return `
      <div class="card" data-index="${PROJECTS.indexOf(p)}" style="animation-delay: ${i * 0.03}s">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="card-name">${p.name}</span>
            ${categoryTag(p.category)}
          </div>
          <a class="card-github" href="${p.github_url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub</a>
        </div>
        <p class="card-desc">${p.description}</p>
        ${updatedText ? `<span class="card-updated">${updatedText}</span>` : ''}
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

  // Category tag in modal
  const cat = CATEGORIES[project.category];
  if (cat) {
    modalCategory.style.display = '';
    modalCategory.textContent = cat.label;
    modalCategory.style.background = cat.color + '22';
    modalCategory.style.color = cat.color;
    modalCategory.style.border = `1px solid ${cat.color}44`;
  } else {
    modalCategory.style.display = 'none';
  }

  // Meta info
  const updatedDate = githubDates[project.github_repo];
  const parts = [];
  if (updatedDate) parts.push(`Last pushed: ${new Date(updatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
  parts.push(`Repo: ${project.github_repo}`);
  modalMeta.textContent = parts.join(' · ');

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

// Search
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderCards();
});

// Sort
sortSelect.addEventListener('change', (e) => {
  sortMode = e.target.value;
  renderCards();
});

// Escape key closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closePending();
  }
});

// Fetch GitHub last-pushed dates
async function fetchGithubDates() {
  try {
    const repos = PROJECTS.map(p => p.github_repo).filter(Boolean);
    const unique = [...new Set(repos)];

    // Fetch in batches using GitHub API (unauthenticated, 60 req/hr limit)
    const results = await Promise.allSettled(
      unique.map(repo =>
        fetch(`https://api.github.com/repos/${repo}`)
          .then(r => r.ok ? r.json() : null)
      )
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        githubDates[unique[i]] = result.value.pushed_at;
      }
    });

    renderCards();
  } catch (e) {
    // Silently fail - dates are just a nice-to-have
  }
}

// Init
renderStats();
renderCategoryFilters();
renderCards();
fetchGithubDates();
