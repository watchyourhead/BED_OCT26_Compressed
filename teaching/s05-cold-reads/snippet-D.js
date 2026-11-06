// Session 5 cold-read D. DELIBERATELY BUGGY. Request: POST /books/9999999999/copies  body: { "copyNo": 1, "rentalRate": 5 }
// (there is no book 9999999999)
async function addCopy(req, res) {
  const { copyNo, rentalRate } = req.body;
  try {
    await bookCopyModel.addCopy(req.params.isbn, copyNo, rentalRate);
    res.status(201).json({ ISBN: req.params.isbn, CopyNo: copyNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
