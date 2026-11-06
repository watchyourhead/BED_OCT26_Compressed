// Controller: plain JavaScript, no SQL. Reads the request, validates it,
// calls the Model and decides which response to send.
const Joi = require('joi');
const bookCopyModel = require('../models/bookCopyModel');

// The same rule as CHECK (RentalRate >= 2.50) on BookCopy, one layer earlier.
const rateSchema = Joi.object({
  rentalRate: Joi.number().min(2.5).required(),
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

module.exports = { updateRate };
