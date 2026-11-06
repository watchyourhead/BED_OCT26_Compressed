// Session 3 cold-read D. DELIBERATELY BUGGY. Request: PUT /books/0064410935 with a body.
app.put('/books/:isbn', async (req, res) => {
  const connection = await sql.connect(dbConfig);
  const request = connection.request();
  request.input('isbn', sql.Char(10), req.params.isbn);
  const result = await request.query(
    "UPDATE Book SET Title = '" + req.body.title + "' WHERE ISBN = @isbn"
  );
  res.status(200).json({ updated: result.rowsAffected[0] });
});
