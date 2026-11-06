// Session 4 cold-read D. DELIBERATELY BUGGY. Something fails AFTER the BookAuthor line.
async function createBookWithAuthor(book) {
  const connection = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(connection);
  await transaction.begin();
  try {
    const bookRequest = transaction.request();
    bookRequest.input('isbn', sql.Char(10), book.isbn);
    bookRequest.input('title', sql.VarChar(200), book.title);
    await bookRequest.query('INSERT INTO Book (ISBN, Title, YearPublish) VALUES (@isbn, @title, 2026)');

    const authorRequest = connection.request(); // <-- not transaction.request()
    authorRequest.input('isbn', sql.Char(10), book.isbn);
    authorRequest.input('authorId', sql.SmallInt, book.authorId);
    await authorRequest.query('INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)');

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
