# Project Portal v1.2

## Overview
A web-based dashboard that displays all of Elmer's projects as interactive cards with progress tracking, feature status, GitHub links, and a suggestion system for new ideas. Pulls project data from local spec files and live GitHub API data.

## Live URL
https://ct-project-portal.netlify.app

## Tech Stack
- HTML/CSS/JS (static site, no framework)
- Deployed on Netlify (auto-deploy via GitHub Actions on push to main)
- GitHub API for live "last pushed" dates
- localStorage for suggestions persistence
- Project data embedded in `projects.js` (compiled from spec files)

## Repo
- GitHub: https://github.com/elmerzc/project-portal
- Netlify: https://app.netlify.com/projects/ct-project-portal
- Local: `/Users/elmerz/Documents/project/project-portal/`

## Files
- `index.html` — Main page structure
- `style.css` — Dark theme styles, responsive layout
- `app.js` — All logic: rendering, search, sort, filters, modals, suggestions
- `projects.js` — Project data (JSON array) + category definitions
- `.github/workflows/deploy.yml` — GitHub Actions auto-deploy to Netlify

## Features

### v1.1 - Initial Release
- [x] Card-based layout showing all 20 projects
- [x] Project name on each card
- [x] Progress bar showing completion percentage
- [x] Click-to-expand card showing full project details
- [x] GitHub repo link on each card
- [x] Feature list with done/pending status
- [x] "Pending Features" button — view all pending features across all projects
- [x] Responsive design (mobile-friendly)
- [x] Dark theme (GitHub-inspired)
- [x] Staggered card load animation

### v1.2 - Current Release
- [x] Summary stats bar (total projects, features done, pending, avg progress, overall bar)
- [x] Search bar — filters by project name, description, and feature names
- [x] Sort dropdown — by progress, name, or last updated
- [x] Category filter pills — Voice AI, Web App, Workflow, Form, Docs
- [x] Color-coded category tags on cards and in modals
- [x] Live "last pushed" dates from GitHub API (e.g., "Updated 5d ago")
- [x] Repo name + last pushed date in modal meta section
- [x] "+ New Idea" button — add feature suggestions to any project
- [x] Priority levels for suggestions (Low / Medium / High)
- [x] "Suggestions" button with badge count
- [x] Suggestions panel — grouped by project, deletable, priority-sorted
- [x] Suggestions shown in project detail modal under "Suggestions" section
- [x] localStorage persistence for suggestions
- [x] Auto-deploy via GitHub Actions on push to main
- [x] Netlify secrets (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID) configured

### Future (v1.3+)
- [ ] Pull latest spec file data from GitHub repos on build
- [ ] Export suggestions to projects.js automatically
- [ ] Project timeline / changelog view
- [ ] Netlify deploy status badge on portal

## Categories
| Key | Label | Color | Projects |
|-----|-------|-------|----------|
| voice-ai | Voice AI | Purple (#a371f7) | Classic Towing AI, Andi, ARIA, Lucas, Grok Voice Agent |
| web-app | Web App | Blue (#58a6ff) | Aventureros, Dispatch Portal, Driver Onboarding, La Estrella, Ronni |
| workflow | Workflow | Green (#3fb950) | Claude Skills, Max, n8n Projects, n8n Workflows, Vapi Tools, Warm Transfer |
| form | Form | Yellow (#d29922) | Pound Access Form, Vehicle Release Form |
| docs | Docs | Gray (#8b949e) | Task Tracker, TwinMind ASR |

## How to Update Project Data
1. Edit `projects.js` — add/remove/update project entries
2. Each project object has: name, description, category, features (array of {name, done}), progress (0-100), github_url, github_repo
3. Push to main — GitHub Actions auto-deploys to Netlify within ~15 seconds

## Projects Tracked (20)
1. Classic Towing Voice AI (Ai) — 80%
2. Andi — 95%
3. ARIA — 95%
4. Aventureros — 85%
5. Claude Skills — 100%
6. Dispatch Portal — 85%
7. Driver Onboarding Portal — 75%
8. Grok Voice Agent — 85%
9. La Estrella — 75%
10. Lucas — 95%
11. Max — 90%
12. n8n Projects — 100%
13. n8n Workflow Organization — 100%
14. Pound Access Form — 50%
15. Vehicle Release Form — 70%
16. Ronni — 100%
17. Task Tracker — 100%
18. TwinMind ASR — 25%
19. Vapi Tools — 100%
20. Warm Transfer Fallback — 100%
