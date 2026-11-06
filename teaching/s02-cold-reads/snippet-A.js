// Session 2 cold-read, Snippet A. DELIBERATELY BUGGY: do not run as part of the app.
// Request: GET /authors/3
app.get('/authors/:id', (req, res) => {
  const id = req.params.id;
  const author = authors.find((a) => a.id === id);
  if (!author) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(200).json(author);
});
