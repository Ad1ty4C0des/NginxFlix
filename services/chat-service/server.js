const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'chat-service'
  })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

wss.on('connection', (ws, req) => {
  const clientIp = req.headers['x-real-ip'] || req.socket.remoteAddress;
  console.log(`[chat-service] Client connected from ${clientIp}`);

  ws.send(JSON.stringify({
    type: 'system',
    text: 'Welcome to NginxFlix Live Chat Room'
  }));

  ws.on('message', (message) => {
    const text = message.toString();
    console.log(`[chat-service] Broadcast: "${text}"`);

    const payload = JSON.stringify({
      type: 'chat',
      text: text,
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  })

  ws.on('close', () => {
    console.log(`[chat-service] Client disconnected`);
  });
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat service listening on port ${PORT}`);
})