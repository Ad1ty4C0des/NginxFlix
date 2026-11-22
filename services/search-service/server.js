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
  if (!query) {
    return res.json({ query: '', count: catalog.length, results: catalog });
  }

  const results = catalog.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.tags.some(tag => tag.toLowerCase().includes(query))
  );

  res.json({
    service: 'search-service',
    query,
    count: results.length,
    results
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Search Service listening on port ${PORT}`);
});
