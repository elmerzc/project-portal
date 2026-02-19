// Netlify serverless function: export-suggestions
// Receives suggestions from the frontend, merges them into projects.js,
// and commits the update to GitHub via the Contents API.

const https = require('https');

const GITHUB_OWNER = 'elmerzc';
const GITHUB_REPO = 'project-portal';
const FILE_PATH = 'projects.js';
const BRANCH = 'main';

function githubRequest(method, path, body) {
  const PAT = process.env.GITHUB_PAT;
  if (!PAT) throw new Error('GITHUB_PAT not configured');

  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'project-portal-export',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${PAT}`,
        ...(bodyStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API ${res.statusCode}: ${json.message || data}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getFileFromGitHub() {
  const data = await githubRequest(
    'GET',
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
  );
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content, sha: data.sha };
}

function parseProjectsJs(raw) {
  const match = raw.match(/const PROJECTS = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('Could not parse PROJECTS array');
  return eval(match[1]);
}

function rebuildProjectsJs(raw, projects) {
  const projectsJson = JSON.stringify(projects, null, 2);
  const categoriesIdx = raw.indexOf('const CATEGORIES');
  const categoriesBlock = categoriesIdx >= 0 ? raw.substring(categoriesIdx) : '';
  return `const PROJECTS = ${projectsJson};\n\n${categoriesBlock}`;
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { suggestions } = JSON.parse(event.body);
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No suggestions provided' }) };
    }

    // Fetch current projects.js from GitHub
    const { content: raw, sha } = await getFileFromGitHub();
    const projects = parseProjectsJs(raw);

    let addedCount = 0;

    for (const suggestion of suggestions) {
      const project = projects.find(p => p.name === suggestion.project);
      if (!project) continue;

      // Avoid duplicates
      const exists = project.features.some(
        f => f.name.toLowerCase() === suggestion.text.toLowerCase()
      );
      if (exists) continue;

      project.features.push({ name: suggestion.text, done: false });
      addedCount++;

      // Recalculate progress
      const done = project.features.filter(f => f.done).length;
      project.progress = Math.round((done / project.features.length) * 100);
    }

    if (addedCount === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No new suggestions to add (all duplicates or unknown projects)', added: 0 }),
      };
    }

    // Rebuild file content
    const newContent = rebuildProjectsJs(raw, projects);
    const encoded = Buffer.from(newContent).toString('base64');

    // Commit to GitHub
    await githubRequest('PUT', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      message: `Add ${addedCount} suggestion(s) from Project Portal`,
      content: encoded,
      sha,
      branch: BRANCH,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: `Successfully exported ${addedCount} suggestion(s)`, added: addedCount }),
    };
  } catch (e) {
    console.error('export-suggestions error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
