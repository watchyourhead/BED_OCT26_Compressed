const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function create(id, name) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', sql.SmallInt, id);
    request.input('name', sql.VarChar(50), name);
    const result = await request.query(
      'INSERT INTO Author (AuthorID, Name) OUTPUT INSERTED.* VALUES (@id, @name)'
    );
    return result.recordset[0];
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

// Optional name filter + paging. The WHERE clause is added only when name was sent.
async function list({ name, page, limit }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    let where = '';
    if (name) {
      where = 'WHERE Name LIKE @name';
      request.input('name', sql.VarChar(52), '%' + name + '%');
    }
    request.input('offset', sql.Int, (page - 1) * limit);
    request.input('limit', sql.Int, limit);
    const result = await request.query(
      `SELECT AuthorID, Name FROM Author ${where}
       ORDER BY Name OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
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

async function exists(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', sql.SmallInt, id);
    const result = await request.query('SELECT AuthorID FROM Author WHERE AuthorID = @id');
    return result.recordset.length > 0;
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

// Station 3: one row in the BookAuthor junction table.
async function linkToBook(isbn, authorId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    request.input('authorId', sql.SmallInt, authorId);
    await request.query('INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)');
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

// Station 4: Author, Book and BookAuthor in one transaction.
async function createBookWithNewAuthor(b) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const authorRequest = transaction.request();
      authorRequest.input('authorId', sql.SmallInt, b.authorId);
      authorRequest.input('authorName', sql.VarChar(50), b.authorName);
      await authorRequest.query('INSERT INTO Author (AuthorID, Name) VALUES (@authorId, @authorName)');

      const bookRequest = transaction.request();
      bookRequest.input('isbn', sql.Char(10), b.isbn);
      bookRequest.input('title', sql.VarChar(200), b.title);
      bookRequest.input('yearPublish', sql.Char(4), b.yearPublish);
      bookRequest.input('publisherId', sql.SmallInt, b.publisherId || null);
      bookRequest.input('bookCat', sql.Char(2), b.bookCat || null);
      await bookRequest.query(
        `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
         VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
      );

      const linkRequest = transaction.request();
      linkRequest.input('isbn', sql.Char(10), b.isbn);
      linkRequest.input('authorId', sql.SmallInt, b.authorId);
      await linkRequest.query('INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)');

      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
    return { ISBN: b.isbn, Title: b.title, AuthorID: b.authorId, AuthorName: b.authorName };
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

module.exports = { create, list, exists, linkToBook, createBookWithNewAuthor };
