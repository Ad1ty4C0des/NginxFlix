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
  res.json({
    service: 'app',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
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