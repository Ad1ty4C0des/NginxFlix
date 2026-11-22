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
