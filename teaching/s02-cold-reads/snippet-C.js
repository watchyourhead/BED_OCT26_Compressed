// Session 2 cold-read, Snippet C. Correct: the 404 is the right answer.
// Request: GET /authors/99
app.get('/authors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const author = authors.find((a) => a.id === id);
  if (!author) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(200).json(author);
});
