// Session 4 cold-read A. DELIBERATELY BUGGY. Request: POST /copies/rent for a copy that is already 'M'.
async function rentCopy(req, res) {
  const { isbn, copyNo } = req.body;
  await bookCopyModel.checkAvailable(isbn, copyNo);
  await bookCopyModel.markRented(isbn, copyNo);
  res.status(200).json({ ISBN: isbn, CopyNo: copyNo, Status: 'M' });
}
