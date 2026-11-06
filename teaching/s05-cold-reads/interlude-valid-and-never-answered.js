// Session 5 interlude, "Valid, And Never Answered". DELIBERATELY BUGGY.
// A valid request passes the check and then nothing answers it. The fix is the last line: next().
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // next();   <-- forgotten
  };
}
