// Session 2 cold-read, Snippet D. DELIBERATELY BUGGY: do not run as part of the app.
// Request: PUT /authors/5   body: { "id": 2, "name": "Mary W. Shelley" }
app.put('/authors/:id', (req, res) => {
  const id = req.body.id;
  const author = authors.find((a) => a.id === id);
  if (!author) {
    return res.status(404).json({ error: 'Not found' });
  }
  author.name = req.body.name;
  res.status(200).json(author);
});
