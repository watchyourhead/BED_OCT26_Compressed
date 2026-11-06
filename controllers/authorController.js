const authorModel = require('../models/authorModel');
const bookModel = require('../models/bookModel');

function fail(res, err) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

// Station 1: 409 when the id is taken.
async function create(req, res) {
  const { id, name } = req.validated.body;
  try {
    res.status(201).json(await authorModel.create(id, name));
  } catch (err) {
    if (err.number === 2627) {
      return res.status(409).json({ error: 'An author with that id already exists' });
    }
    fail(res, err);
  }
}

// Station 2
async function list(req, res) {
  try {
    res.status(200).json(await authorModel.list(req.validated.query));
  } catch (err) {
    fail(res, err);
  }
}

// Station 3: the ISBN is in the URL, the authorId is in the body.
// 404: no such book or author.  409: this author is already linked to this book.
async function linkToBook(req, res) {
  const { isbn } = req.validated.params;
  const { authorId } = req.validated.body;
  try {
    if (!(await bookModel.exists(isbn))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (!(await authorModel.exists(authorId))) {
      return res.status(404).json({ error: 'Author not found' });
    }
    await authorModel.linkToBook(isbn, authorId);
    res.status(201).json({ ISBN: isbn, AuthorID: authorId });
  } catch (err) {
    if (err.number === 2627) {
      return res.status(409).json({ error: 'That author is already linked to this book' });
    }
    fail(res, err);
  }
}

// Station 4: 409 when the ISBN or author id is taken. 400 when the publisher or category is not real.
async function createBookWithNewAuthor(req, res) {
  try {
    res.status(201).json(await authorModel.createBookWithNewAuthor(req.validated.body));
  } catch (err) {
    if (err.number === 2627) {
      return res.status(409).json({ error: 'That ISBN or author id already exists' });
    }
    if (err.number === 547) {
      return res.status(400).json({ error: 'Unknown publisherId or bookCat' });
    }
    fail(res, err);
  }
}

module.exports = { create, list, linkToBook, createBookWithNewAuthor };
