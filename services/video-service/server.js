const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const videos = [
  { id: 1, title: "Nginx Masterclass: Zero to Hero", genre: "DevOps", duration: "10s", streamUrl: "/videos/1/stream" },
  { id: 2, title: "Reverse Proxy Architecture", genre: "Networking", duration: "10s", streamUrl: "/videos/2/stream" },
  { id: 3, title: "Microservices Architecture Patterns", genre: "Cloud", duration: "10s", streamUrl: "/videos/3/stream" }
];

app.use((req, res, next) => {
  console.log(`[video-service] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ service: 'video-service', version: 'v1' });
});

app.get('/videos', (req, res) => {
  res.json(videos);
});

app.get('/videos/:id', (req, res) => {
  const video = videos.find(v => v.id === parseInt(req.params.id, 10));
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

// --- HTTP 206 Byte-Range Video Streaming Endpoint ---
app.get('/videos/:id/stream', (req, res) => {
  const videoPath = path.join(__dirname, 'sample.mp4');

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video file missing' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse Range header (e.g. "bytes=32768-")
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Send full file if no range header was specified
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// --- Branded HTML5 Video Player Web Interface ---
app.get('/videos/:id/watch', (req, res) => {
  const id = parseInt(req.params.id, 10) || 1;
  const video = videos.find(v => v.id === id) || { title: `Video ${id}` };

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watch: ${video.title} — NginxFlix</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <style>
    :root {
      --primary: #E50914;
      --bg: #141414;
      --card-bg: #1f1f1f;
      --text: #ffffff;
      --text-muted: #888888;
      --border: #333333;
      --accent: #46d369;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 30px 20px;
    }
    header {
      width: 100%;
      max-width: 900px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .brand { font-size: 1.8rem; font-weight: 900; color: var(--primary); text-decoration: none; }
    .nav-links a { color: #fff; text-decoration: none; margin-left: 18px; font-weight: 500; font-size: 0.95rem; }
    .nav-links a:hover { color: var(--primary); }
    .player-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 900px;
      box-shadow: 0 16px 32px rgba(0,0,0,0.5);
    }
    h1 { font-size: 1.8rem; margin-bottom: 8px; }
    .video-container {
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      margin: 16px 0 20px;
      aspect-ratio: 16 / 9;
      box-shadow: 0 8px 16px rgba(0,0,0,0.6);
    }
    video {
      width: 100%;
      height: 100%;
      display: block;
    }
    .diagnostics {
      background: #111;
      border: 1px solid #282828;
      border-radius: 8px;
      padding: 16px 20px;
      font-family: monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--accent);
    }
    .diagnostics span { color: #fff; font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <a href="https://www.nginxflix.local" class="brand">NginxFlix</a>
    <div class="nav-links">
      <a href="https://app.nginxflix.local">App</a>
      <a href="https://cdn.nginxflix.local/videos">CDN Catalog</a>
      <a href="https://ws.nginxflix.local">Live Chat</a>
    </div>
  </header>

  <div class="player-card">
    <h1>${video.title}</h1>
    <p style="color: var(--text-muted); font-size: 0.95rem;">Streaming over NGINX Edge CDN with HTTP 206 Partial Content (Byte-Range)</p>
    
    <div class="video-container">
      <video controls autoplay loop playsinline>
        <source src="/videos/${id}/stream" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>

    <div class="diagnostics">
      &gt; Stream Source: <span>https://cdn.nginxflix.local/videos/${id}/stream</span><br>
      &gt; Protocol Handling: <span>HTTP/1.1 206 Partial Content</span> (Chunked Buffer)<br>
      &gt; Codec: <span>H.264 (AVC1) / AAC Audio @ 720p 30fps</span><br>
      &gt; Edge Caching Policy: <span>proxy_cache cdn_cache; proxy_cache_valid 200 24h;</span>
    </div>
  </div>
</body>
</html>`);
});

// Static placeholder thumbnail (preserves compatibility with test suite)
app.get('/videos/:id/thumbnail', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const video = videos.find(v => v.id === id) || { title: `Video ${id}` };

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#141414"/>
      <rect x="10" y="10" width="620" height="340" fill="#1f1f1f" rx="10"/>
      <circle cx="320" cy="180" r="45" fill="#E50914"/>
      <polygon points="310,160 340,180 310,200" fill="#ffffff"/>
      <text x="320" y="270" fill="#ffffff" font-size="20" font-family="sans-serif" text-anchor="middle" font-weight="bold">${video.title}</text>
      <text x="320" y="300" fill="#aaaaaa" font-size="14" font-family="sans-serif" text-anchor="middle">NginxFlix CDN Stream</text>
    </svg>
  `.trim());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'video-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Video Service listening on port ${PORT}`);
});
