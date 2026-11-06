const Joi = require('joi');

// Station 1: body of POST /authors. AuthorID is not IDENTITY, so the client supplies it.
const newAuthorSchema = Joi.object({
  id: Joi.number().integer().min(1).required(),
  name: Joi.string().max(50).required(),
});

// Station 2: optional name filter and paging for GET /authors.
const authorQuerySchema = Joi.object({
  name: Joi.string().max(50),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Station 3: body of POST /books/:isbn/authors.
const linkAuthorSchema = Joi.object({
  authorId: Joi.number().integer().min(1).required(),
});

// Station 4: a new book and a new author, created together.
const bookWithNewAuthorSchema = Joi.object({
  isbn: Joi.string().pattern(/^[0-9]{9}[0-9X]$/).required(),
  title: Joi.string().max(200).required(),
  yearPublish: Joi.string().pattern(/^[0-9]{4}$/).required(),
  publisherId: Joi.number().integer().min(1),
  bookCat: Joi.string().valid('C', 'F', 'NF'),
  authorId: Joi.number().integer().min(1).required(),
  authorName: Joi.string().max(50).required(),
});

module.exports = { newAuthorSchema, authorQuerySchema, linkAuthorSchema, bookWithNewAuthorSchema };
