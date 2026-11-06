// Session 2 cold-read, Snippet B. DELIBERATELY BUGGY: do not run as part of the app.
// Request: POST /authors   body: { "id": 6, "name": "Edgar Allan Poe" }
app.post('/authors', (req, res) => {
  const { id, name } = req.query;
  const author = { id, name };
  authors.push(author);
  res.status(201).json(author);
});
