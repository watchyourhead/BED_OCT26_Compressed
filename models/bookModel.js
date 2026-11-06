// Model: every SQL query and every connection for Book lives here.
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// The JOIN lives in the Model. BookAuthor only holds ids, so Author is
// joined in to bring the names along.
async function getAuthorsByISBN(isbn) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    const result = await request.query(
      `SELECT ba.ISBN, a.AuthorID, a.Name
       FROM BookAuthor ba
       JOIN Author a ON a.AuthorID = ba.AuthorID
       WHERE ba.ISBN = @isbn`
    );
    return result.recordset;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// Two writes, one transaction: Book and BookAuthor are saved together or not at all.
// Both INSERTs use transaction.request(), so both belong to the transaction.
async function createBookWithAuthor(book) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const bookRequest = transaction.request();
      bookRequest.input('isbn', sql.Char(10), book.isbn);
      bookRequest.input('title', sql.VarChar(200), book.title);
      bookRequest.input('yearPublish', sql.Char(4), book.yearPublish);
      bookRequest.input('publisherId', sql.SmallInt, book.publisherId);
      bookRequest.input('bookCat', sql.Char(2), book.bookCat);
      await bookRequest.query(
        `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
         VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
      );

      const authorRequest = transaction.request();
      authorRequest.input('isbn', sql.Char(10), book.isbn);
      authorRequest.input('authorId', sql.SmallInt, book.authorId);
      await authorRequest.query(
        'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
      );

      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
    return { ISBN: book.isbn, Title: book.title, AuthorID: book.authorId };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

module.exports = { getAuthorsByISBN, createBookWithAuthor };
