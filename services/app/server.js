const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'app-standalone';

// Load external HTML template once at startup
const htmlTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
    const rendered = htmlTemplate
      .replace(/\{\{INSTANCE_ID\}\}/g, INSTANCE_ID)
      .replace(/\{\{PORT\}\}/g, PORT)
      .replace(/\{\{REQUEST_ID\}\}/g, (req.headers['x-request-id'] || 'local-trace').substring(0, 12))
      .replace(/\{\{RAW_JSON\}\}/g, JSON.stringify(payload));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(rendered);
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
