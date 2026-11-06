// Session 5 cold-read B. DELIBERATELY BUGGY. Request: GET /books?limit=500
function checkLimit(req, res, next) {
  if (req.query.limit && Number(req.query.limit) > 50) {
    res.status(400).json({ error: 'limit is at most 50' });
  } else if (req.query.limit) {
    next();
  }
  // no limit at all: nothing happens here, so the request hangs
}
