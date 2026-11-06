// Controller: calls the Model and sends the response. No SQL here.
const bookModel = require('../models/bookModel');

async function getAuthors(req, res) {
  try {
    const authors = await bookModel.getAuthorsByISBN(req.params.isbn);
    res.status(200).json(authors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const created = await bookModel.createBookWithAuthor(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAuthors, create };
