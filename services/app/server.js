const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'app-standalone';

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || 'none';
  console.log(`[${new Date().toISOString()}] [${INSTANCE_ID}] ${req.method} ${req.url} (Request-ID: ${requestId})`);
  next();
});

app.get('/', (req, res) => {
  const isHtml = req.headers.accept && req.headers.accept.includes('text/html') && !req.query.json;
  const payload = {
    service: 'app',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  };

  if (isHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Instance: ${INSTANCE_ID} — NginxFlix</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <style>
    body {
      background: #141414;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #1f1f1f;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 36px 32px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(70, 211, 105, 0.15);
      color: #46d369;
      border: 1px solid rgba(70, 211, 105, 0.3);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #46d369;
      box-shadow: 0 0 8px #46d369;
    }
    h1 { margin: 0 0 10px; font-size: 2rem; font-weight: 800; }
    h1 span { color: #E50914; }
    p { color: #999; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px; }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      text-align: left;
    }
    .metric-box {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 12px;
    }
    .metric-label { font-size: 0.75rem; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-val { font-size: 0.95rem; font-weight: 700; color: #eee; margin-top: 4px; font-family: monospace; }
    .raw-view {
      background: #0f0f0f;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 12px;
      text-align: left;
      font-family: monospace;
      font-size: 0.82rem;
      color: #46d369;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .actions { display: flex; gap: 12px; justify-content: center; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #E50914;
      color: #fff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: #b80710; }
    .btn-secondary {
      background: #2a2a2a;
      border: 1px solid #444;
    }
    .btn-secondary:hover { background: #333; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="pulse-dot"></span> NGINX Upstream Node</div>
    <h1>Instance: <span>${INSTANCE_ID}</span></h1>
    <p>This request was proxied through NGINX using the <strong>least_conn</strong> load balancing algorithm with passive health checks.</p>
    
    <div class="metrics">
      <div class="metric-box">
        <div class="metric-label">Algorithm</div>
        <div class="metric-val">least_conn</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Passive Health Check</div>
        <div class="metric-val">max_fails=3 (30s)</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Request ID</div>
        <div class="metric-val">${(req.headers['x-request-id'] || 'local-trace').substring(0, 12)}...</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Internal Port</div>
        <div class="metric-val">:${PORT}</div>
      </div>
    </div>

    <div class="raw-view">${JSON.stringify(payload)}</div>

    <div class="actions">
      <button class="btn" onclick="location.reload()">⚡ Refresh (Hit Load Balancer Again)</button>
      <a href="/" class="btn btn-secondary">&larr; Return to Portal</a>
    </div>
  </div>
</body>
</html>`);
  }

  res.json(payload);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    instance: INSTANCE_ID,
  });
});

app.get('/slow', (req, res) => {
  setTimeout(() => {
    res.json({
      service: 'app',
      instance: INSTANCE_ID,
      delayedMs: 2000,
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 App service [${INSTANCE_ID}] running on port ${PORT}`);
});
