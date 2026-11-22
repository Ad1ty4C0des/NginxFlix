const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Load external HTML template once at startup
const htmlTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
    const resultItems = results.map(r => `
      <div class="result-item">
        <div class="result-title">${r.title}</div>
        <div class="tags">
          <span class="tag" style="color: #46d369;">${r.category}</span>
          ${r.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    const rendered = htmlTemplate
      .replace('{{SEARCH_QUERY}}', query)
      .replace('{{RESULT_ITEMS}}', resultItems)
      .replace('{{RAW_JSON}}', JSON.stringify(payload));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(rendered);
  }

  res.json(payload);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Search Service listening on port ${PORT}`);
});
