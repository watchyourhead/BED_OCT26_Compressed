// Session 3 cold-read A. DELIBERATELY BUGGY. Request: DELETE /books/0064410935/copies/2
app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
  const connection = await sql.connect(dbConfig);
  const request = connection.request();
  request.input('isbn', sql.Char(10), req.params.isbn);
  const result = await request.query('DELETE FROM BookCopy WHERE ISBN = @isbn');
  res.status(204).send();
});
