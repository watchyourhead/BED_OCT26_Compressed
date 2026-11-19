const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');
const Joi = require('joi'); // Session 4: validation (npm install joi)

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

// =====================================================================
// SESSION 3 DEMOS  (tag: s3-demos, built on s02-oal-end)
// ---------------------------------------------------------------------
// Everything the Session 3 IPL runs live, in slide order. Comments name
// slides by title, not number, because the deck keeps changing.
//
//   PART A  GOOD ROUTES  - what the slides teach. Students build these
//                          themselves in OAL Labs 6 and 7.
//   PART B  BAD ROUTES   - deliberately wrong, for the "predict, then
//                          run" demos. Each one copies a good route and
//                          changes ONE thing. Never copy these.
//   PART C  COLD-READ    - the four S3 Cold-Read Quiz snippets, runnable,
//                          under /s3-snippet-a/ to /s3-snippet-d/, so you
//                          can check the answers before class.
//
// Requests to send, in order: requests/s3-demos.http
// Test data and clean-up SQL:  requests/s3-demos.sql
// Test ISBNs all start with 00000000, so they never clash with a real book.
// =====================================================================


// =====================================================================
// PART A  GOOD ROUTES
// =====================================================================

// ---------------------------------------------------------------------
// A1  GET /books  ->  MOVED to the Session 4 block (S4-A6). In Session 4
//     the same route gains an optional ?title= search. Express uses the
//     first route that matches, so there must only be one GET /books.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// A2  GET /books/:isbn                 GET /books/:isbn slide | Live Demo 1, Q2 and Q3
//                                      Optional injection recap (B1), step 2
// The ISBN is text: bind it with sql.Char(10), never parseInt.
// An empty recordset means 404.
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// A3  POST /books  (WITH a transaction)  Wrapping the Writes slide | Live Demo 2, Q2 and Q3
// Two writes, one decision: Book and BookAuthor are both saved, or
// neither is. BOTH requests come from transaction.request().
// Compare with B3 (POST /postbookdemo), which has no transaction.
// ---------------------------------------------------------------------
app.post('/books', async (req, res) => {
  const { isbn, title, yearPublish, publisherId, bookCat, authorId } = req.body;
  let connection;
  let transaction;
  try {
    connection = await sql.connect(dbConfig);
    transaction = new sql.Transaction(connection);
    await transaction.begin();

    const bookRequest = transaction.request();          // <-- inside the transaction
    bookRequest.input('isbn', sql.Char(10), isbn);
    bookRequest.input('title', sql.VarChar(200), title);
    bookRequest.input('yearPublish', sql.Char(4), yearPublish);
    bookRequest.input('publisherId', sql.SmallInt, publisherId);
    bookRequest.input('bookCat', sql.Char(2), bookCat);
    const bookResult = await bookRequest.query(
      `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
       OUTPUT INSERTED.*
       VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
    );

    const authorRequest = transaction.request();        // <-- inside the transaction
    authorRequest.input('isbn', sql.Char(10), isbn);
    authorRequest.input('authorId', sql.SmallInt, authorId);
    await authorRequest.query(
      'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
    );

    await transaction.commit();                         // both rows, together
    res.status(201).json(bookResult.recordset[0]);
  } catch (err) {
    console.error(err);
    if (transaction) {
      try {
        await transaction.rollback();                   // undoes BOTH inserts
      } catch (rollbackErr) {
        console.error('Error rolling back:', rollbackErr);
      }
    }
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
// A4  PUT /books/:isbn                 PUT /books/:isbn slide | Live Demo 2, Q4
// One UPDATE is already all or nothing, so no transaction here.
// rowsAffected[0] === 0 means no such book: 404.
// ---------------------------------------------------------------------
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
       OUTPUT INSERTED.*
       WHERE ISBN = @isbn`
    );
    if (result.rowsAffected[0] === 0) {
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

// ---------------------------------------------------------------------
// A5  GET /books/:isbn/copies/:copyNo  Composite-key GET slide
// A composite key: ISBN and CopyNo together find one BookCopy row.
// Both are bound, and the WHERE uses both.
// ---------------------------------------------------------------------
app.get('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    const result = await request.query(
      `SELECT ISBN, CopyNo, RentalRate, Status
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

// ---------------------------------------------------------------------
// A6  PUT /books/:isbn/copies/:copyNo  ->  MOVED to the Session 4 block
//     (S4-A5). In Session 4 it validates rentalRate with Joi first, so
//     1.00 now gets a readable 400 instead of the database's 500.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// A7  DELETE /books/:isbn/copies/:copyNo  PUT/DELETE slide
// Both parts of the key in the WHERE, so exactly one copy goes.
// (Cold-Read Snippet A is this route with CopyNo left out.)
// ---------------------------------------------------------------------
app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
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
// A8  GET /authors/:id/books           An author's books slide | Live Demo 3
// A JOIN: BookAuthor only holds ids, so it is matched against Book inside
// one query. One row, many rows or none: res.json(result.recordset)
// handles all three, and an author with no books is 200 with [].
// ---------------------------------------------------------------------
app.get('/authors/:id/books', async (req, res) => {
  const authorId = parseInt(req.params.id); // AuthorID really is a number
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


// =====================================================================
// PART B  BAD ROUTES  -  DEMO ONLY. DELIBERATELY WRONG. NEVER COPY.
// Each is a good route from Part A with ONE line changed, marked
// "<-- THE BUG". Delete this part before the code goes anywhere else.
// =====================================================================

// ---------------------------------------------------------------------
// B1  GET /getbookdemo/:isbn           OPTIONAL: not on a slide. A 2-minute
//                                      recap of Session 2's SQL injection,
//                                      on Book's text key, if time allows.
// Copy of A2 with the ISBN GLUED into the SQL string instead of bound.
// Try: GET /getbookdemo/' OR '1'='1
//   The SQL becomes  WHERE ISBN = '' OR '1'='1'  which is true for every
//   row, so this answers 200 with the first book in the table.
//   A2 (GET /books/:isbn) answers the same request with 404.
// ---------------------------------------------------------------------
app.get('/getbookdemo/:isbn', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().query(
      "SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book " +
      "WHERE ISBN = '" + req.params.isbn + "'"          // <-- THE BUG: glued, not bound
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

// ---------------------------------------------------------------------
// B2  GET /parseintbookdemo/:isbn      The Disappearing Zero / Live Demo 1, Q4
//                                      Live Demo 1, Q4
// Copy of A2 with parseInt on the ISBN, the Session 2 habit.
// Try: GET /parseintbookdemo/0099826704
//   parseInt drops the leading zeros (99826704), so nothing matches: 404
//   for a book that exists. A2 answers the same request with 200.
// ---------------------------------------------------------------------
app.get('/parseintbookdemo/:isbn', async (req, res) => {
  const isbn = parseInt(req.params.isbn);               // <-- THE BUG: an ISBN is text
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    const result = await request.query(
      'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book WHERE ISBN = @isbn'
    );
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Not found', lookedFor: isbn });
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

// ---------------------------------------------------------------------
// B3  POST /postbookdemo  (NO transaction)  Live Demo 2, Q1
// Copy of A3 with the transaction taken out: two separate INSERTs.
// Try it with authorId 999 (no such author):
//   the Book INSERT succeeds, the BookAuthor INSERT fails on the foreign
//   key, and the Book row is LEFT BEHIND with no author (an orphan).
//   Show it in SSMS, then delete it (requests/s3-demos.sql).
//   A3 (POST /books) answers the same request with 500 and NO Book row.
// ---------------------------------------------------------------------
app.post('/postbookdemo', async (req, res) => {
  const { isbn, title, yearPublish, publisherId, bookCat, authorId } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    // <-- THE BUG: no transaction. Each query below succeeds or fails on its own.

    const bookRequest = connection.request();
    bookRequest.input('isbn', sql.Char(10), isbn);
    bookRequest.input('title', sql.VarChar(200), title);
    bookRequest.input('yearPublish', sql.Char(4), yearPublish);
    bookRequest.input('publisherId', sql.SmallInt, publisherId);
    bookRequest.input('bookCat', sql.Char(2), bookCat);
    const bookResult = await bookRequest.query(
      `INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
       OUTPUT INSERTED.*
       VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)`
    );                                                  // saved for good, right now

    const authorRequest = connection.request();
    authorRequest.input('isbn', sql.Char(10), isbn);
    authorRequest.input('authorId', sql.SmallInt, authorId);
    await authorRequest.query(
      'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
    );                                                  // fails for author 999

    res.status(201).json(bookResult.recordset[0]);
  } catch (err) {
    console.error(err);
    // Nothing to roll back: the Book row from the first INSERT stays.
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

// =====================================================================
// PART C  S3 COLD-READ SNIPPETS A TO D  -  INSTRUCTOR CHECK ONLY.
// DELIBERATELY WRONG. NEVER COPY.
// ---------------------------------------------------------------------
// Runnable copies of the four Cold-Read Quiz slides (S3 Cold-Read Snippets A to D),
// so you can check each answer before class. Every route starts with
// /s3-snippet-<letter>/ so it can never be mistaken for a real route.
// Students only READ these in class; nobody needs to run them.
// Run them on test book 0000000003 (requests/s3-demos.sql), never on
// seed data: Snippet A really does delete every copy.
// =====================================================================

// ---------------------------------------------------------------------
// C-A  DELETE /s3-snippet-a/books/:isbn/copies/:copyNo     Snippet A
// Q: What does this DELETE route do?
// A: Deletes EVERY copy of the book. :copyNo arrives but is never bound
//    or used, so the WHERE matches all copies. 204, no error, no warning.
// ---------------------------------------------------------------------
app.delete('/s3-snippet-a/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input('isbn', sql.Char(10), req.params.isbn)
      .query('DELETE FROM BookCopy WHERE ISBN = @isbn'); // <-- THE BUG: no CopyNo
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
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
// C-B  POST /s3-snippet-b/books/:isbn/copies               Snippet B
// Q: What does the logic in this POST route do?
// A: An INSERT with no OUTPUT returns no recordset: result.recordset is
//    undefined, so .length throws a TypeError. The catch turns it into a
//    500, yet the row WAS saved. Success is read from rowsAffected[0].
//    TO VERIFY on mssql 11: the exact error in the terminal.
// ---------------------------------------------------------------------
app.post('/s3-snippet-b/books/:isbn/copies', async (req, res) => {
  const { copyNo, rentalRate } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input('isbn', sql.Char(10), req.params.isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .input('rentalRate', sql.SmallMoney, rentalRate)
      .query(
        'INSERT INTO BookCopy (ISBN, CopyNo, RentalRate) VALUES (@isbn, @copyNo, @rentalRate)'
      );
    if (result.recordset.length === 0) {                // <-- THE BUG: read rowsAffected[0]
      return res.status(500).json({ error: 'Insert failed' });
    }
    res.status(201).json({ isbn: req.params.isbn, copyNo, rentalRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
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
// C-C  GET /s3-snippet-c/books/:isbn/copies/:copyNo        Snippet C
// Q: What does this GET route actually return?
// A: An empty body, every time. The query is never awaited: .then() sets
//    result later, but res.json(result) has already run with undefined.
// The .catch() is NOT on the slide. It is here only because finally closes
// the connection while the query is still running, and an unhandled
// rejection would crash the demo server.
// ---------------------------------------------------------------------
app.get('/s3-snippet-c/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  let result;
  try {
    connection = await sql.connect(dbConfig);
    connection
      .request()
      .input('isbn', sql.Char(10), req.params.isbn)
      .input('copyNo', sql.TinyInt, req.params.copyNo)
      .query('SELECT * FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo')
      .then((r) => {                                     // <-- THE BUG: no await
        result = r.recordset;
      })
      .catch((err) => console.error('Snippet C query:', err.message)); // demo safety only
    res.json(result);                                    // runs before .then()
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
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
// C-D  POST /s3-snippet-d/books                            Snippet D
// Q: What's wrong with this POST route?
// A: The Book INSERT uses connection.request(), so it runs OUTSIDE the
//    transaction. With authorId 999 the BookAuthor INSERT fails and
//    rollback() runs, but it cannot undo the Book row: an orphan is left.
//    Compare with A3 (POST /books). Clean up with requests/s3-demos.sql.
//    TO VERIFY on SQL Server before class.
// ---------------------------------------------------------------------
app.post('/s3-snippet-d/books', async (req, res) => {
  const { isbn, title, yearPublish, authorId } = req.body;
  let connection, transaction;
  try {
    connection = await sql.connect(dbConfig);
    transaction = new sql.Transaction(connection);
    await transaction.begin();

    const bookRequest = connection.request();            // <-- THE BUG: not transaction.request()
    bookRequest.input('isbn', sql.Char(10), isbn);
    bookRequest.input('title', sql.VarChar(200), title);
    bookRequest.input('year', sql.Char(4), yearPublish);
    await bookRequest.query(
      'INSERT INTO Book (ISBN, Title, YearPublish) VALUES (@isbn, @title, @year)'
    );

    const authorRequest = transaction.request();
    authorRequest.input('isbn', sql.Char(10), isbn);
    authorRequest.input('authorId', sql.SmallInt, authorId);
    await authorRequest.query(
      'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
    );

    await transaction.commit();
    res.status(201).json({ isbn, title, authorId });
  } catch (err) {
    console.error(err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back:', rollbackErr);
      }
    }
    res.status(500).json({ error: 'Database error' });
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

// ===================== END OF SESSION 3 DEMOS ========================


// =====================================================================
// SESSION 4 DEMOS  (tag: s4-demos, built on s3-demos)
// ---------------------------------------------------------------------
// Everything the Session 4 IPL runs live, in slide order. Still all in
// app.js: no MVC until Session 5.
//
//   PART A  GOOD ROUTES  - what the slides teach. Students build these
//                          themselves in OAL Labs 8, 9 and 10.
//   PART B  DEMO ROUTES  - the "before" picture and the deliberately
//                          broken routes for the failing-safely demo.
//                          Each one says what it changes. Never copy.
//   PART C  COLD-READ    - the four S4 Cold-Read Quiz snippets, runnable,
//                          under /s4-snippet-a/ to /s4-snippet-d/, so you
//                          can check the answers before class.
//
// Needs Joi: npm install joi  (required at the top of this file).
// Requests to send, in order: requests/s4-demos.http
// Test data and resets:        requests/s4-demos.sql
// =====================================================================


// =====================================================================
// PART A  GOOD ROUTES
// =====================================================================

// ---------------------------------------------------------------------
// S4-A1  Joi schemas                   Slides 18 to 26
// copySchema checks the PATH (isbn + copyNo together, like the composite
// key). rateSchema checks the BODY of the rate change.
// Path values arrive as strings; Joi turns "2" into 2 and hands the clean
// values back in `value`.
// ---------------------------------------------------------------------
const copySchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).required(),
});

const rateSchema = Joi.object({
  rentalRate: Joi.number().min(2.5).required(),   // mirrors CHECK (RentalRate >= 2.50)
});

// ---------------------------------------------------------------------
// S4-A2  Helpers: one looks, one writes  Slides 12 to 15
// No req, no res: helpers only talk to the database. Any error they hit
// goes up to the route's catch.
// ---------------------------------------------------------------------

// Looks. null = no such copy, true = free (Status 'D'), false = taken.
async function checkAvailable(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query('SELECT Status FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo');
    if (result.recordset.length === 0) return null;
    return result.recordset[0].Status === 'D';
  } finally {
    if (connection) await connection.close();
  }
}

// Writes: rented.
async function markRented(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query("UPDATE BookCopy SET Status = 'M' WHERE ISBN = @isbn AND CopyNo = @copyNo");
  } finally {
    if (connection) await connection.close();
  }
}

// Writes: back on the shelf.
async function markReturned(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query("UPDATE BookCopy SET Status = 'D' WHERE ISBN = @isbn AND CopyNo = @copyNo");
  } finally {
    if (connection) await connection.close();
  }
}

// Writes: a new rental rate. Returns the updated row, or null if no such copy.
async function updateRate(isbn, copyNo, rentalRate) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .input('rentalRate', sql.SmallMoney, rentalRate)
      .query(
        `UPDATE BookCopy SET RentalRate = @rentalRate
         OUTPUT INSERTED.*
         WHERE ISBN = @isbn AND CopyNo = @copyNo`
      );
    return result.recordset[0] || null;
  } finally {
    if (connection) await connection.close();
  }
}

// ---------------------------------------------------------------------
// S4-A3  PUT /books/:isbn/copies/:copyNo/rent
//        What You'll Build (slide 4) | Slides 13 to 15 | Slides 21 to 26
// Check the shape (Joi, 400), check the row (404), check the state (409),
// and only then write (200). Any database failure: your own 500.
// Compare with S4-B1, the same job done inline in one route.
// ---------------------------------------------------------------------
app.put('/books/:isbn/copies/:copyNo/rent', async (req, res) => {
  const { error, value } = copySchema.validate(req.params);          // shape first
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const available = await checkAvailable(value.isbn, value.copyNo);  // look
    if (available === null) return res.status(404).json({ error: 'Not found' });
    if (available === false) return res.status(409).json({ error: 'Copy is already rented' });
    await markRented(value.isbn, value.copyNo);                        // then write
    res.status(200).json({ ISBN: value.isbn, copyNo: value.copyNo, Status: 'M' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------------------
// S4-A4  PUT /books/:isbn/copies/:copyNo/return      (OAL Lab 9)
// Not shown on a slide: the rent route the other way round. Here so you
// can reset a rented copy, and check Lab 9 answers.
// ---------------------------------------------------------------------
app.put('/books/:isbn/copies/:copyNo/return', async (req, res) => {
  const { error, value } = copySchema.validate(req.params);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const available = await checkAvailable(value.isbn, value.copyNo);
    if (available === null) return res.status(404).json({ error: 'Not found' });
    if (available === true) return res.status(409).json({ error: 'Copy is not rented' });
    await markReturned(value.isbn, value.copyNo);
    res.status(200).json({ ISBN: value.isbn, copyNo: value.copyNo, Status: 'D' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------------------
// S4-A5  PUT /books/:isbn/copies/:copyNo   (replaces S3 A6)
//        Cold-Read: Validation (slides 19 and 20) | Slides 27 and 28
// Joi checks the body BEFORE any query: 1.00 -> 400, {} -> 400,
// 3.50 -> 200. The database's CHECK constraint is still there behind it.
// ---------------------------------------------------------------------
app.put('/books/:isbn/copies/:copyNo', async (req, res) => {
  const params = copySchema.validate(req.params);
  if (params.error) return res.status(400).json({ error: params.error.details[0].message });
  const { error, value } = rateSchema.validate(req.body);              // body first
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const copy = await updateRate(params.value.isbn, params.value.copyNo, value.rentalRate);
    if (!copy) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(copy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------------------
// S4-A6  GET /books  and  GET /books?title=...   (replaces S3 A1)
//        Searching Books (slides 29 to 31) | OAL Lab 10
// ?title= is optional. Check first: no title, no WHERE clause.
// The title is still bound with .input(), so a search never becomes SQL.
// Compare with S4 Snippet D (/s4-snippet-d/books), which skips the check.
// ---------------------------------------------------------------------
app.get('/books', async (req, res) => {
  const { title } = req.query;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    let query = 'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book';
    if (title) {                                                       // only when given
      query += " WHERE Title LIKE '%' + @title + '%'";
      request.input('title', sql.VarChar(200), title);
    }
    const result = await request.query(query);
    res.status(200).json(result.recordset);                            // [] is still 200
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
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

// (Failing safely, slide 35: the good DELETE /books/:isbn/copies/:copyNo
//  is S3 A7 above. It already has its database call inside try/catch.)


// =====================================================================
// PART B  DEMO ROUTES  -  "BEFORE" AND DELIBERATELY BROKEN. NEVER COPY.
// =====================================================================

// ---------------------------------------------------------------------
// S4-B1  PUT /putrentinlinedemo/:isbn/copies/:copyNo     Slide 11
// THE "BEFORE" PICTURE. Not broken: it gives the same answers as S4-A3
// (minus the Joi check). The problem is that the lookup, the availability
// rule and the update are all buried in one route, so a return route
// would have to copy and paste them. Slides 12 to 14 pull them out into
// checkAvailable() and markRented().
// ---------------------------------------------------------------------
app.put('/putrentinlinedemo/:isbn/copies/:copyNo', async (req, res) => {
  const { isbn, copyNo } = req.params;
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const check = await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query('SELECT Status FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo');

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (check.recordset[0].Status !== 'D') {
      return res.status(409).json({ error: 'Copy is already rented' });
    }

    await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query("UPDATE BookCopy SET Status = 'M' WHERE ISBN = @isbn AND CopyNo = @copyNo");

    res.status(200).json({ ISBN: isbn, copyNo: Number(copyNo), Status: 'M' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
// deleteCopyBroken(): a helper that ALWAYS fails, for the failing-safely
// demo. It is deleteCopy() with the table name misspelt on purpose
// ("BookCopyy"), so you can make a database call throw on demand.
// Nothing is ever deleted.
// ---------------------------------------------------------------------
async function deleteCopyBroken(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .query('DELETE FROM BookCopyy WHERE ISBN = @isbn AND CopyNo = @copyNo'); // <-- broken on purpose
  } finally {
    if (connection) await connection.close();
  }
}

// ---------------------------------------------------------------------
// S4-B2  DELETE /deletecopynotrydemo/:isbn/copies/:copyNo   Slide 34
// "Delete Route, No Safety Net". The call is NOT inside try/catch.
// The helper throws, nothing in your code catches it, so Express 5's
// default handler answers: a generic 500 page (HTML, with a stack trace
// outside production), no JSON, and no log line of yours.
// TO VERIFY on your Express 5 version before class.
// ---------------------------------------------------------------------
app.delete('/deletecopynotrydemo/:isbn/copies/:copyNo', async (req, res) => {
  const { isbn, copyNo } = req.params;
  await deleteCopyBroken(isbn, copyNo);                 // <-- THE BUG: no try/catch
  res.status(204).send();
});

// ---------------------------------------------------------------------
// S4-B3  DELETE /deletecopytrydemo/:isbn/copies/:copyNo     Slide 35
// "Catching It, Responding Clean". The same failing helper, now inside
// try. Your catch runs instead of Express's page: a 500 with JSON you
// wrote, and the real error in YOUR terminal.
// ---------------------------------------------------------------------
app.delete('/deletecopytrydemo/:isbn/copies/:copyNo', async (req, res) => {
  const { isbn, copyNo } = req.params;
  try {
    await deleteCopyBroken(isbn, copyNo);
    res.status(204).send();
  } catch (err) {
    console.error(err);                                 // you see "Invalid object name 'BookCopyy'"
    res.status(500).json({ error: 'Database error' });
  }
});


// =====================================================================
// PART C  S4 COLD-READ SNIPPETS A TO D  -  INSTRUCTOR CHECK ONLY.
// DELIBERATELY WRONG. NEVER COPY.
// ---------------------------------------------------------------------
// Runnable copies of the four Cold-Read Quiz slides (S4 slides 40 to 43).
// Every route starts with /s4-snippet-<letter>/ so it can never be
// mistaken for a real route. Students only READ these in class.
// =====================================================================

// Two helpers the snippets call. Both are correct; the bugs are in the routes.
async function addCopy(isbn, copyNo, rentalRate) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input('isbn', sql.Char(10), isbn)
      .input('copyNo', sql.TinyInt, copyNo)
      .input('rentalRate', sql.SmallMoney, rentalRate)
      .query(
        `INSERT INTO BookCopy (ISBN, CopyNo, RentalRate, Status)
         OUTPUT INSERTED.*
         VALUES (@isbn, @copyNo, @rentalRate, 'D')`
      );
    return result.recordset[0];
  } finally {
    if (connection) await connection.close();
  }
}

async function setRentalRate(isbn, copyNo, rentalRate) {
  const copy = await updateRate(isbn, copyNo, rentalRate);
  return copy ? copy.RentalRate : null;
}

// ---------------------------------------------------------------------
// S4-C-A  PUT /s4-snippet-a/books/:isbn/copies/:copyNo/rent   Slide 40
// Q: What happens if the copy is already rented?
// A: It rents it again: 200 every time. checkAvailable() is awaited but
//    its answer is thrown away, so markRented() always runs.
// ---------------------------------------------------------------------
app.put('/s4-snippet-a/books/:isbn/copies/:copyNo/rent', async (req, res) => {
  const { isbn, copyNo } = req.params;
  try {
    await checkAvailable(isbn, copyNo);                 // <-- THE BUG: result ignored
    await markRented(isbn, copyNo);
    res.status(200).json({ isbn, copyNo, status: 'rented' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------------------
// S4-C-B  POST /s4-snippet-b/books/:isbn/copies               Slide 41
// Q: Does this request make it past validation?
// A: Yes: every field passes its own check. But copy 2 already exists,
//    so the INSERT breaks the primary key (ISBN, CopyNo). With no
//    try/catch, Express 5's default handler sends a generic 500.
//    Validation never asked whether this PAIR already exists.
// ---------------------------------------------------------------------
app.post('/s4-snippet-b/books/:isbn/copies', async (req, res) => {
  const { isbn } = req.params;
  const { copyNo, rentalRate } = req.body;

  if (typeof isbn !== 'string' || isbn.length !== 10) {
    return res.status(400).json({ error: 'isbn must be 10 characters' });
  }
  if (!Number.isInteger(copyNo) || copyNo <= 0) {
    return res.status(400).json({ error: 'copyNo must be a positive integer' });
  }
  if (typeof rentalRate !== 'number' || rentalRate < 2.5) {
    return res.status(400).json({ error: 'rentalRate must be at least 2.50' });
  }

  const copy = await addCopy(isbn, copyNo, rentalRate);  // <-- THE BUG: pair never checked, no try
  res.status(201).json(copy);
});

// ---------------------------------------------------------------------
// S4-C-C  PUT /s4-snippet-c/books/:isbn/copies/:copyNo        Slide 42
// Q: What happens when this request is sent? (rentalRate 1.00)
// A: The CHECK constraint refuses 1.00, setRentalRate() throws, and with
//    no try/catch Express 5's default handler sends a generic 500 page.
//    Your code never logs it. TO VERIFY on your Express 5 version.
// ---------------------------------------------------------------------
app.put('/s4-snippet-c/books/:isbn/copies/:copyNo', async (req, res) => {
  const { isbn, copyNo } = req.params;
  const { rentalRate } = req.body;

  const updated = await setRentalRate(isbn, copyNo, rentalRate); // <-- THE BUG: no try/catch
  res.status(200).json({ isbn, copyNo, rentalRate: updated });
});

// ---------------------------------------------------------------------
// S4-C-D  GET /s4-snippet-d/books                             Slide 43
// Q: What does the client get back when the URL has no title filter?
// A: 200 and []. req.query.title is undefined, the route binds it
//    anyway, and LIKE '%' + NULL + '%' matches nothing. No error, which
//    is the trap. TO VERIFY on SQL Server before class.
// ---------------------------------------------------------------------
app.get('/s4-snippet-d/books', async (req, res) => {
  const { title } = req.query;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input('title', sql.VarChar(200), title)          // <-- THE BUG: bound even when undefined
      .query("SELECT * FROM Book WHERE Title LIKE '%' + @title + '%'");
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
});

// ===================== END OF SESSION 4 DEMOS ========================


app.listen(port, () => {
  console.log(`bookcat-api listening on http://localhost:${port}`);
});
