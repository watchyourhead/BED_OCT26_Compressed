// Session 4 cold-read C. DELIBERATELY BUGGY. Request: PUT /books/0064410935/copies/1  body: { "rentalRate": 1.5 }
async function setRentalRate(req, res) {
  const copyNo = parseInt(req.params.copyNo);
  await bookCopyModel.setRentalRate(req.params.isbn, copyNo, req.body.rentalRate);
  res.status(200).json({ ISBN: req.params.isbn, CopyNo: copyNo });
}
