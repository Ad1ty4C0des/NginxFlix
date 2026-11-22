const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const catalog = [
  { id: 1, title: "Nginx Masterclass: Zero to Hero", category: "video", tags: ["nginx", "proxy", "devops"] },
  { id: 2, title: "Reverse Proxy Architecture", category: "video", tags: ["nginx", "networking"] },
  { id: 3, title: "Microservices Architecture Patterns", category: "video", tags: ["cloud", "docker"] },
  { id: 4, title: "Alice Smith Profile", category: "user", tags: ["alice", "premium"] },
  { id: 5, title: "Bob Jones Profile", category: "user", tags: ["bob", "standard"] }
];

app.use((req, res, next) => {
  console.log(`[search-service] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ service: 'search-service', version: 'v1' });
});

app.get('/search', (req, res) => {
  const query = (req.query.q || '').toString().toLowerCase();
  const results = !query ? catalog : catalog.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.tags.some(tag => tag.toLowerCase().includes(query))
  );

  const payload = {
    service: 'search-service',
    query,
    count: results.length,
    results
  };

  const isHtml = req.headers.accept && req.headers.accept.includes('text/html') && !req.query.json;
  if (isHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Catalog Search — NginxFlix API Gateway</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body { background: #141414; color: #fff; font-family: -apple-system, sans-serif; padding: 40px 20px; max-width: 720px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    h1 { margin: 0 0 6px; font-size: 1.8rem; }
    p { color: #888; font-size: 0.9rem; }
    .badge { display: inline-block; background: rgba(229, 9, 20, 0.2); color: #E50914; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-bottom: 12px; }
    .search-box { display: flex; gap: 8px; margin-bottom: 24px; }
    input { flex: 1; background: #1f1f1f; border: 1px solid #444; border-radius: 6px; padding: 10px 14px; color: #fff; font-size: 0.95rem; }
    button { background: #E50914; border: none; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .results-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
    .result-item { background: #1c1c1c; border: 1px solid #333; border-radius: 8px; padding: 14px 18px; }
    .result-title { font-weight: bold; font-size: 1rem; margin-bottom: 4px; }
    .tags { display: flex; gap: 6px; }
    .tag { background: #2a2a2a; color: #999; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; }
    .raw-view { background: #0f0f0f; border: 1px solid #282828; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 0.85rem; color: #46d369; overflow-x: auto; margin-bottom: 20px; }
    .btn { display: inline-block; background: #2a2a2a; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #444; }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">API Gateway: /v1/search</div>
    <h1>Unified Catalog Search</h1>
    <p>Search across video streams and user subscriptions through NGINX edge routing.</p>
  </div>

  <form class="search-box" method="GET" action="">
    <input type="text" name="q" value="${query}" placeholder="Search videos or users (e.g. nginx, devops, premium)...">
    <button type="submit">Search</button>
  </form>

  <div class="results-list">
    ${results.map(r => `
      <div class="result-item">
        <div class="result-title">${r.title}</div>
        <div class="tags">
          <span class="tag" style="color: #46d369;">${r.category}</span>
          ${r.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <h3 style="font-size: 0.95rem; color: #888; margin-bottom: 8px;">Raw JSON Output:</h3>
  <div class="raw-view">${JSON.stringify(payload)}</div>
  <a href="/" class="btn">&larr; Return to Dashboard</a>
</body>
</html>`);
  }

  res.json(payload);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Search Service listening on port ${PORT}`);
});
