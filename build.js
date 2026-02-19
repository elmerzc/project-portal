#!/usr/bin/env node
// build.js — Pulls spec file data from GitHub repos and updates projects.js
// Runs during CI before deploy. Requires GITHUB_TOKEN env var.

const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, 'projects.js');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function githubFetch(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'project-portal-build',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function parseCheckboxes(content) {
  const lines = content.split('\n');
  const features = [];

  for (const line of lines) {
    const checkedMatch = line.match(/^[\s]*- \[x\]\s+(.+)/i);
    const uncheckedMatch = line.match(/^[\s]*- \[ \]\s+(.+)/);

    if (checkedMatch) {
      features.push({ name: checkedMatch[1].trim(), done: true });
    } else if (uncheckedMatch) {
      features.push({ name: uncheckedMatch[1].trim(), done: false });
    }
  }

  return features;
}

async function fetchSpecFile(repo, specFile) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(specFile)}`;
  const data = await githubFetch(url);

  if (!data.content) {
    throw new Error('No content in response');
  }

  // GitHub API returns base64 encoded content
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

async function main() {
  console.log('build.js: Starting spec file pull...');

  if (!GITHUB_TOKEN) {
    console.warn('build.js: No GITHUB_TOKEN set. Skipping spec pull (will use static data).');
    return;
  }

  // Read current projects.js
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');

  // Extract the PROJECTS array (everything between first [ and the matching ])
  const projectsMatch = raw.match(/const PROJECTS = (\[[\s\S]*?\n\]);/);
  if (!projectsMatch) {
    console.error('build.js: Could not parse PROJECTS array from projects.js');
    process.exit(1);
  }

  // Use eval to parse (it's our own file, safe in CI)
  let projects;
  try {
    projects = eval(projectsMatch[1]);
  } catch (e) {
    console.error('build.js: Failed to eval PROJECTS array:', e.message);
    process.exit(1);
  }

  // Also extract CATEGORIES
  const categoriesMatch = raw.match(/const CATEGORIES = (\{[\s\S]*?\});/);

  let updated = 0;

  for (const project of projects) {
    if (!project.spec_file || !project.github_repo) {
      continue;
    }

    console.log(`  Fetching spec for ${project.name} (${project.github_repo}/${project.spec_file})...`);

    try {
      const content = await fetchSpecFile(project.github_repo, project.spec_file);
      const features = parseCheckboxes(content);

      if (features.length === 0) {
        console.log(`    No checkboxes found, skipping.`);
        continue;
      }

      project.features = features;
      const done = features.filter(f => f.done).length;
      project.progress = Math.round((done / features.length) * 100);
      updated++;
      console.log(`    Updated: ${done}/${features.length} done (${project.progress}%)`);
    } catch (e) {
      console.log(`    Failed: ${e.message} (keeping static data)`);
    }
  }

  if (updated > 0) {
    // Rebuild projects.js
    const projectsJson = JSON.stringify(projects, null, 2);
    let output = `const PROJECTS = ${projectsJson};\n`;

    if (categoriesMatch) {
      // Keep categories as-is from original file
      output += `\n${raw.substring(raw.indexOf('const CATEGORIES'))}`;
    }

    fs.writeFileSync(PROJECTS_FILE, output, 'utf-8');
    console.log(`build.js: Updated ${updated} project(s) in projects.js`);
  } else {
    console.log('build.js: No projects updated (no spec_file entries or all fetches failed).');
  }
}

main().catch(e => {
  console.error('build.js: Fatal error:', e.message);
  // Don't fail the build — static data is fine
  process.exit(0);
});
