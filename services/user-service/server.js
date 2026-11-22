const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const users = [
  { id: 1, name: "Alice Smith", plan: "Premium 4K", email: "alice@nginxflix.local" },
  { id: 2, name: "Bob Jones", plan: "Standard HD", email: "bob@nginxflix.local" },
  { id: 3, name: "Charlie Davis", plan: "Basic", email: "charlie@nginxflix.local" }
];

app.use((req, res, next) => {
  console.log(`[user-service] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ service: 'user-service', version: 'v1' });
});

app.get('/users', (req, res) => {
  const isHtml = req.headers.accept && req.headers.accept.includes('text/html') && !req.query.json;

  if (isHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Directory — NginxFlix API Gateway</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body { background: #141414; color: #fff; font-family: -apple-system, sans-serif; padding: 40px 20px; max-width: 720px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    h1 { margin: 0 0 6px; font-size: 1.8rem; }
    p { color: #888; font-size: 0.9rem; }
    .badge { display: inline-block; background: rgba(229, 9, 20, 0.2); color: #E50914; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-bottom: 12px; }
    .user-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
    .user-card { background: #1f1f1f; border: 1px solid #333; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .user-name { font-weight: bold; font-size: 1.05rem; }
    .user-email { color: #888; font-size: 0.85rem; font-family: monospace; }
    .user-plan { background: #2a2a2a; color: #46d369; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; border: 1px solid #3d3d3d; }
    .raw-view { background: #0f0f0f; border: 1px solid #282828; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 0.85rem; color: #46d369; overflow-x: auto; margin-bottom: 20px; }
    .btn { display: inline-block; background: #2a2a2a; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #444; }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">API Gateway: /v1/users</div>
    <h1>User Directory Service</h1>
    <p>Proxied via NGINX API Gateway with strict path boundary matching, rate limiting, and CORS headers.</p>
  </div>

  <div class="user-list">
    ${users.map(u => `
      <div class="user-card">
        <div>
          <div class="user-name">${u.name}</div>
          <div class="user-email">${u.email}</div>
        </div>
        <div class="user-plan">${u.plan}</div>
      </div>
    `).join('')}
  </div>

  <h3 style="font-size: 0.95rem; color: #888; margin-bottom: 8px;">Raw JSON Output:</h3>
  <div class="raw-view">${JSON.stringify(users)}</div>
  <a href="/" class="btn">&larr; Return to Dashboard</a>
</body>
</html>`);
  }

  res.json(users);
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 User Service listening on port ${PORT}`);
});
