// Controller: plain JavaScript, no SQL. Reads the request, validates it,
// calls the Model and decides which response to send.
const Joi = require('joi');
const bookCopyModel = require('../models/bookCopyModel');

// The same rule as CHECK (RentalRate >= 2.50) on BookCopy, one layer earlier.
const rateSchema = Joi.object({
  rentalRate: Joi.number().min(2.5).required(),
});

// One schema checks the pair together: a copy is identified by isbn AND copyNo.
const copySchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).required(),
});

async function updateRate(req, res) {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }

  const { error, value } = rateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const changed = await bookCopyModel.updateRate(req.params.isbn, copyNo, value.rentalRate);
    if (changed === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(200).json({
      ISBN: req.params.isbn,
      CopyNo: copyNo,
      RentalRate: value.rentalRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Orchestration: the Controller calls one Model to check, then another to write.
// It never runs SQL itself.
async function rentCopy(req, res) {
  const { error, value } = copySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { isbn, copyNo } = value;

  try {
    const available = await bookCopyModel.checkAvailable(isbn, copyNo);
    if (available === null) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!available) {
      // Do not touch the table: the copy is already out.
      return res.status(409).json({ error: 'Copy is already rented' });
    }
    await bookCopyModel.markRented(isbn, copyNo);
    res.status(200).json({ ISBN: isbn, CopyNo: copyNo, Status: 'M' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Every Model call sits inside try / catch, so a failed query gives a clean 500.
async function deleteCopy(req, res) {
  const copyNo = parseInt(req.params.copyNo);
  if (isNaN(copyNo)) {
    return res.status(400).json({ error: 'Invalid copy number' });
  }
  try {
    const deleted = await bookCopyModel.deleteCopy(req.params.isbn, copyNo);
    if (deleted === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Practice solution: same shape as rentCopy. Check, then write.
async function returnCopy(req, res) {
  const { error, value } = copySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { isbn, copyNo } = value;

  try {
    const rented = await bookCopyModel.checkRented(isbn, copyNo);
    if (rented === null) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!rented) {
      return res.status(409).json({ error: 'Copy is not rented' });
    }
    await bookCopyModel.markReturned(isbn, copyNo);
    res.status(200).json({ ISBN: isbn, CopyNo: copyNo, Status: 'D' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { updateRate, rentCopy, deleteCopy, returnCopy };
