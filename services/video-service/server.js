const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Load external watch HTML template once at startup
const watchHtmlTemplate = fs.readFileSync(path.join(__dirname, 'watch.html'), 'utf8');

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

// --- Branded HTML5 Video Player Web Interface (Imported from watch.html) ---
app.get('/videos/:id/watch', (req, res) => {
  const id = parseInt(req.params.id, 10) || 1;
  const video = videos.find(v => v.id === id) || { title: `Video ${id}` };

  const rendered = watchHtmlTemplate
    .replace(/\{\{VIDEO_ID\}\}/g, id)
    .replace(/\{\{VIDEO_TITLE\}\}/g, video.title);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(rendered);
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
