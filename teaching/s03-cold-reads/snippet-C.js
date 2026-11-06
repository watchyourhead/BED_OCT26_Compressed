// Session 3 cold-read C. DELIBERATELY BUGGY. Request: GET /books/0064410935/copies/1
app.get('/books/:isbn/copies/:copyNo', async (req, res) => {
  const connection = await sql.connect(dbConfig);
  const request = connection.request();
  request.input('isbn', sql.Char(10), req.params.isbn);
  request.input('copyNo', sql.TinyInt, parseInt(req.params.copyNo));
  let result;
  request
    .query('SELECT * FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo')
    .then((r) => {
      result = r.recordset[0];
    });
  res.json(result);
});
