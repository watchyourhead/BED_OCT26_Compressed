// Session 3 cold-read B. DELIBERATELY BUGGY. Request: POST /books with a valid body.
app.post('/books', async (req, res) => {
  const connection = await sql.connect(dbConfig);
  const request = connection.request();
  request.input('isbn', sql.Char(10), req.body.isbn);
  request.input('title', sql.VarChar(200), req.body.title);
  const result = await request.query(
    'INSERT INTO Book (ISBN, Title, YearPublish) VALUES (@isbn, @title, 2026)'
  );
  if (!result.recordset[0]) {
    return res.status(500).json({ error: 'Insert failed' });
  }
  res.status(201).json(result.recordset[0]);
});
