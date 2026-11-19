const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

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
// Everything the Session 3 IPL runs live, in slide order.
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
// A1  GET /books                       Slide 11 | Live Demo 1, Q1
// A list route has nothing to bind. An empty table is still 200 and [].
// ---------------------------------------------------------------------
app.get('/books', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .query('SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book');
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

// ---------------------------------------------------------------------
// A2  GET /books/:isbn                 Slide 12 | Live Demo 1, Q2 and Q3
//                                      Glue It In? (slide 13), step 3
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
// A3  POST /books  (WITH a transaction)  Slide 22 | Live Demo 2, Q2 and Q3
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
// A4  PUT /books/:isbn                 Slide 23 | Live Demo 2, Q4
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
// A5  GET /books/:isbn/copies/:copyNo  Slide 28
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
// A6  PUT /books/:isbn/copies/:copyNo  Slides 29 and 30 (CHECK demo)
// Change one copy's rental rate. BookCopy has CHECK (RentalRate >= 2.50),
// so 1.00 is refused by the DATABASE: the error lands in catch as a 500.
// (Catching it earlier with a readable 400 is Session 4's Joi.)
// ---------------------------------------------------------------------
app.put('/books/:isbn/copies/:copyNo', async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    request.input('rentalRate', sql.SmallMoney, req.body.rentalRate);
    const result = await request.query(
      `UPDATE BookCopy SET RentalRate = @rentalRate
       OUTPUT INSERTED.*
       WHERE ISBN = @isbn AND CopyNo = @copyNo`
    );
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(err); // the terminal shows the CHECK constraint error
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
// A7  DELETE /books/:isbn/copies/:copyNo  Slide 29
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
// A8  GET /authors/:id/books           Slide 34 | Live Demo 3
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
// B1  GET /getbookdemo/:isbn           Glue It In? (slide 13)
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
// B2  GET /parseintbookdemo/:isbn      The Disappearing Zero (slide 14)
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
// Runnable copies of the four Cold-Read Quiz slides (S3 slides 39 to 42),
// so you can check each answer before class. Every route starts with
// /s3-snippet-<letter>/ so it can never be mistaken for a real route.
// Students only READ these in class; nobody needs to run them.
// Run them on test book 0000000003 (requests/s3-demos.sql), never on
// seed data: Snippet A really does delete every copy.
// =====================================================================

// ---------------------------------------------------------------------
// C-A  DELETE /s3-snippet-a/books/:isbn/copies/:copyNo     Slide 39
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
// C-B  POST /s3-snippet-b/books/:isbn/copies               Slide 40
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
// C-C  GET /s3-snippet-c/books/:isbn/copies/:copyNo        Slide 41
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
// C-D  POST /s3-snippet-d/books                            Slide 42
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


app.listen(port, () => {
  console.log(`bookcat-api listening on http://localhost:${port}`);
});
