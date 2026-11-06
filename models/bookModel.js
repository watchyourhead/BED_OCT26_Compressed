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

module.exports = { getAuthorsByISBN };
