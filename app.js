const express = require('express');

const app = express();
const port = 3000;

// Session 1 OAL: the first route. A plain text response.
app.get('/', (req, res) => {
  res.send('Hello from bookcat-api!');
});

// Session 1 OAL: a route that sends JSON. The data is a hardcoded array
// that lives in memory, so it resets every time the server restarts.
const categories = [
  { id: 1, name: 'Fiction' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
];

app.get('/categories', (req, res) => {
  res.json(categories);
});

app.listen(port, () => {
  console.log(`bookcat-api listening on http://localhost:${port}`);
});
