// Session 4 cold-read B. Request: POST /books/0064410935/copies  body: { "copyNo": 2, "rentalRate": 7.5 }
// (copy 2 of this book already exists)
const copySchema = Joi.object({
  isbn: Joi.string().length(10).required(),
  copyNo: Joi.number().integer().min(1).required(),
  rentalRate: Joi.number().min(2.5).required(),
});

async function addCopy(req, res) {
  const { error } = copySchema.validate({ isbn: req.params.isbn, ...req.body });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  await bookCopyModel.addCopy(req.params.isbn, req.body.copyNo, req.body.rentalRate);
  res.status(201).json({ ok: true });
}
