const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');
const bookController = require('./controllers/bookController');
const bookCopyController = require('./controllers/bookCopyController');

const app = express();
const port = 3000;

// Lets routes read JSON sent in the request body as req.body.
// This line must come before the routes.
app.use(express.json());

// Session 1 OAL: the first two routes.
app.get('/', (req, res) => {
  res.send('Hello from bookcat-api!');
});

const categories = [
  { id: 1, name: 'Fiction' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
];

app.get('/categories', (req, res) => {
  res.json(categories);
});

// ---------------------------------------------------------------------
// Session 2 IPL: routes that read and write the Author table in the
// NP Bookstore database (AuthorID smallint, Name varchar(50)).
// Every route follows the same shape:
//   read the request, connect, run the query, send a response,
//   and always close the connection in finally.
// ---------------------------------------------------------------------

// GET /authors: all authors.
app.get('/authors', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .query('SELECT AuthorID, Name FROM Author');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// GET /authors/:id: one author.
app.get('/authors/:id', async (req, res) => {
  // req.params.id is always a string, so convert it first.
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    const result = await request.query(
      'SELECT AuthorID, Name FROM Author WHERE AuthorID = @id'
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// POST /authors: add an author.
// No NP Bookstore primary key is IDENTITY, so the client sends the id.
// A duplicate id breaks the primary key and ends up in catch as a 500.
app.post('/authors', async (req, res) => {
  const { id, name } = req.body;

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', id);
    request.input('name', name);
    const result = await request.query(
      'INSERT INTO Author (AuthorID, Name) OUTPUT INSERTED.* VALUES (@id, @name)'
    );
    // OUTPUT INSERTED.* returns the row exactly as stored.
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// PUT /authors/:id: change an author's name.
// The URL (req.params) picks the row. The body (req.body) carries the new value.
app.put('/authors/:id', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { name } = req.body;

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    request.input('name', name);
    const result = await request.query(
      'UPDATE Author SET Name = @name WHERE AuthorID = @id'
    );
    // An UPDATE that matches no row is not an error to SQL Server,
    // so the route has to check.
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json({ AuthorID: authorId, Name: name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// DELETE /authors/:id: remove an author.
// An author who is referenced in BookAuthor is refused by the foreign key,
// which ends up in catch as a 500.
app.delete('/authors/:id', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', authorId);
    const result = await request.query(
      'DELETE FROM Author WHERE AuthorID = @id'
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    // 204 means success with no body, so this is the one response without .json().
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// ---------------------------------------------------------------------
// Session 3 IPL: from array to table, against Book, BookCopy and
// BookAuthor. Same pattern as Session 2: connect, bind every value with
// .input(), close in finally. Book.ISBN is char(10) and BookCopy is
// identified by ISBN and CopyNo together.
// ---------------------------------------------------------------------

// One book by ISBN. An empty recordset means 404.
app.get('/books/:isbn', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    const result = await request.query(
      'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book WHERE ISBN = @isbn'
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// Add a book and who wrote it. Two writes, so they go in one transaction:
// both rows are saved, or neither is.
app.post('/books', async (req, res) => {
  const { isbn, title, yearPublish, publisherId, bookCat, authorId } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const bookRequest = transaction.request();
      bookRequest.input('isbn', sql.Char(10), isbn);
      bookRequest.input('title', sql.VarChar(200), title);
      bookRequest.input('yearPublish', sql.Char(4), yearPublish);
      bookRequest.input('publisherId', sql.SmallInt, publisherId);
      bookRequest.input('bookCat', sql.Char(2), bookCat);
      await bookRequest.query(
        `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
         VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
      );

      const authorRequest = transaction.request();
      authorRequest.input('isbn', sql.Char(10), isbn);
      authorRequest.input('authorId', sql.SmallInt, authorId);
      await authorRequest.query(
        'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
      );

      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
    res.status(201).json({ ISBN: isbn, Title: title, AuthorID: authorId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// Update a book. Every changed field is bound with .input().
app.put('/books/:isbn', async (req, res) => {
  const { title, yearPublish, publisherId, bookCat } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('title', sql.VarChar(200), title);
    request.input('yearPublish', sql.Char(4), yearPublish);
    request.input('publisherId', sql.SmallInt, publisherId);
    request.input('bookCat', sql.Char(2), bookCat);
    const result = await request.query(
      `UPDATE Book
       SET Title = @title, YearPublish = @yearPublish,
           PublisherID = @publisherId, BookCat = @bookCat
       WHERE ISBN = @isbn`
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json({
      ISBN: req.params.isbn,
      Title: title,
      YearPublish: yearPublish,
      PublisherID: publisherId,
      BookCat: bookCat,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// A JOIN: the books one author wrote. BookAuthor only holds ids, so it is
// matched against Book before the result reaches res.json().
// The result can have one row, many rows or none.
app.get('/authors/:id/books', async (req, res) => {
  const authorId = parseInt(req.params.id);
  if (isNaN(authorId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('authorId', sql.SmallInt, authorId);
    const result = await request.query(
      `SELECT b.ISBN, b.Title, b.YearPublish
       FROM Book b
       JOIN BookAuthor ba ON ba.ISBN = b.ISBN
       WHERE ba.AuthorID = @authorId`
    );
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// A composite key: one BookCopy row needs the ISBN and the CopyNo together.
// Both bind with .input(), and the WHERE clause uses both.
app.get('/books/:isbn/copies/:copyNo', async (req, res) => {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    const result = await request.query(
      `SELECT ISBN, CopyNo, DateIn, RentalRate, Status
       FROM BookCopy
       WHERE ISBN = @isbn AND CopyNo = @copyNo`
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    const result = await request.query(
      'DELETE FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
});

// ---------------------------------------------------------------------
// Session 3 OAL: the same logic, split in two (MVC).
// The route is only a pointer now. The Controller decides, the Model queries.
// ---------------------------------------------------------------------
app.put('/books/:isbn/copies/:copyNo', bookCopyController.updateRate);
app.get('/books/:isbn/authors', bookController.getAuthors);

app.listen(port, () => {
  console.log(`bookcat-api listening on http://localhost:${port}`);
});
