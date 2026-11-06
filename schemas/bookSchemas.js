const Joi = require('joi');

// Search, sort and paging for GET /books. Every key is optional.
// req.query values always arrive as strings. Joi converts page and limit to numbers.
const bookQuerySchema = Joi.object({
  title: Joi.string().max(200),
  bookCat: Joi.string().valid('C', 'F', 'NF'),
  sort: Joi.string().valid('title', 'year').default('title'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// :isbn in the path.
const isbnParamSchema = Joi.object({
  isbn: Joi.string().pattern(/^[0-9]{9}[0-9X]$/).required(),
});

// Body of POST /books/:isbn/copies. The ISBN comes from the URL, not the body.
const newCopySchema = Joi.object({
  copyNo: Joi.number().integer().min(1).max(255).required(),
  rentalRate: Joi.number().min(2.5).required(),
});

module.exports = { bookQuerySchema, isbnParamSchema, newCopySchema };
