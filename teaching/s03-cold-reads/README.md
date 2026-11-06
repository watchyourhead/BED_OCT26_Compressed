# Session 3 cold-read snippets (instructor only)

Reconstructed from the slide titles and speaker notes. **Compare with the code images on slides 35 to 38 before relying on them.** All four are deliberately wrong.

| Snippet | Question on the slide | Answer (from the speaker notes) |
|---|---|---|
| A | What does this DELETE route do? | It deletes **every** copy of that book, not one. `:copyNo` is never bound or used in the WHERE clause, so the WHERE is too broad. No error, no warning. |
| B | What does the logic in this POST route do? | An INSERT has no recordset, so `result.recordset` is always empty and the check reports "Insert failed" even on success. Success is read from `result.rowsAffected[0]`. |
| C | What does this GET route actually return? | The route never `await`s the query. It attaches `.then()`, and `res.json(result)` runs while `result` is still `undefined`, so the client gets an empty body every time. |
| D | What is wrong with this PUT route? | `isbn` is bound with `.input()`, but `title` from `req.body` is concatenated into the query string. One unbound value reopens SQL injection. |
