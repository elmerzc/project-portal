# Project Portal v1.1

## Overview
A web-based dashboard that displays all of Elmer's projects as interactive cards with progress tracking, feature status, and GitHub links. Pulls project data from local spec files and GitHub repos.

## Tech Stack
- HTML/CSS/JS (static site)
- Deployed on Netlify
- GitHub API for repo metadata
- Project data embedded from spec files (updated via GitHub Actions or manual rebuild)

## Features

### v1.1 - Initial Release
- [x] Card-based layout showing all projects
- [x] Project name on each card
- [x] Progress bar showing completion percentage
- [x] Click-to-expand card showing full project details
- [x] GitHub repo link on each card
- [x] Feature list with done/pending status
- [x] Section to view pending features across all projects
- [x] Responsive design (mobile-friendly)
- [x] Dark theme matching developer aesthetic

### Future (v1.2+)
- [ ] Add new feature requests via the portal UI
- [ ] Auto-update via GitHub webhook on push
- [ ] Pull latest spec file data from GitHub on build
- [ ] Filter/search projects
- [ ] Sort by progress, name, last updated
- [ ] Project categories/tags

## Data Source
Project metadata is compiled from spec files (`*-v*.md`) in each project folder. The portal embeds this data as a JSON object in the build. Future versions will pull directly from GitHub.

## Deployment
- Netlify site
- GitHub repo: elmerzc/project-portal
- Auto-deploy on push to main

## Projects Tracked (20)
1. Classic Towing Voice AI (Ai)
2. Andi - Dispatch Call-Taker
3. ARIA - Virtual Receptionist
4. Aventureros - Club Management
5. Claude Skills - Dispatch Reports
6. Dispatch Portal - Driver Check-in
7. Driver Onboarding Portal
8. Grok Voice Agent
9. La Estrella - Hardware Store Inventory
10. Lucas - Storage Assistant
11. Max - SMS Agent
12. n8n Projects - Workflow Collection
13. n8n Workflow Organization
14. Pound Access Form
15. Vehicle Release Form
16. Ronni - TTC Reporting
17. Task Tracker
18. TwinMind ASR
19. Vapi Tools
20. Warm Transfer Fallback
