// Session 5 cold-read C. DELIBERATELY BUGGY. Request: GET /books   (no query string)
async function list(req, res) {
  const { title } = req.query; // undefined
  const request = connection.request();
  request.input('title', sql.VarChar(200), title); // bound as NULL
  const result = await request.query(
    "SELECT ISBN, Title FROM Book WHERE Title LIKE '%' + @title + '%'"
  );
  res.status(200).json(result.recordset); // []
}
