# Project Portal v1.3

## Overview
Four new features added to the Project Portal dashboard at ct-project-portal.netlify.app.

## Features

### Feature 1: Build Script — Spec File Pull from GitHub
- [x] `build.js` Node.js script fetches spec files via GitHub Contents API
- [x] Parses `- [x]` and `- [ ]` checkbox lines to extract features
- [x] Recalculates progress percentage per project
- [x] Falls back to static data on failure (doesn't break builds)
- [x] `spec_file` field added to all 20 projects in `projects.js`
- [x] Populated spec_file for projects with checkbox-based specs (Aventureros, Driver Onboarding, Pound Access Form, Release Form)
- [x] `.github/workflows/deploy.yml` updated to run `node build.js` before deploy

### Feature 2: Export Suggestions to Repo (GitHub Auto-Commit)
- [x] `netlify/functions/export-suggestions.js` serverless function
- [x] Fetches current `projects.js` from GitHub, merges suggestions as pending features
- [x] Commits updated file via GitHub Contents API (PUT with SHA)
- [x] Avoids duplicate features (case-insensitive name match)
- [x] Recalculates progress for affected projects
- [x] "Export to Repo" button in Suggestions panel (visible when suggestions exist)
- [x] Success/error status feedback with styled toast
- [x] Clears exported suggestions from localStorage on success
- [x] GitHub PAT created (fine-grained, repo scope, Contents read/write + Metadata read)
- [x] `GITHUB_PAT` env var added in Netlify site settings
- [x] Tested and verified working on live site

### Feature 3: Project Timeline / Changelog View
- [x] "Timeline" button added to header
- [x] Modal with vertical timeline, colored dots matching category colors
- [x] Projects sorted by last GitHub push date (most recent first)
- [x] Shows: project name, category tag, time ago, date, feature progress
- [x] Link to recent commits on GitHub per project
- [x] Uses existing `githubDates` data from `fetchGithubDates()`
- [x] Escape key and overlay click to close

### Feature 4: Netlify Deploy Status Badge
- [x] Deploy status badge image in header next to logo
- [x] Links to Netlify deploys page when clicked
- [x] Uses Netlify badge API endpoint

## Files Changed
- `index.html` — Timeline modal, deploy badge, export button, suggestions header
- `app.js` — Timeline logic, export suggestions logic
- `style.css` — Timeline styles, deploy badge styles, export status styles, suggestions header
- `projects.js` — Added `spec_file` field to all 20 projects, populated 4 with spec filenames
- `.github/workflows/deploy.yml` — Switched to Netlify CLI deploy with Node 18, build step for spec pull

## Files Created
- `build.js` — CI build script for spec file pulling
- `netlify.toml` — Netlify config (functions directory)
- `netlify/functions/export-suggestions.js` — Serverless export function (CommonJS, uses fetch API)
- `project-portal-v1.3.md` — This spec file

## Technical Notes
- Deploy method switched from `nwtgck/actions-netlify` action to `netlify-cli` direct deploy — the action didn't deploy functions correctly
- Export function uses CommonJS (`exports.handler`) not ESM — Netlify Node 18 runtime requires this for `.js` files
- Function uses global `fetch` (available in Node 18+) instead of `require('https')`
- GitHub PAT is fine-grained with Contents (read/write) + Metadata (read) permissions scoped to project-portal repo

## Environment
- **Live site**: https://ct-project-portal.netlify.app
- **GitHub**: https://github.com/elmerzc/project-portal
- **Node version on Netlify**: v18.20.8
- **Netlify env vars**: `GITHUB_PAT` (for export function), `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` (in GitHub Actions secrets)
