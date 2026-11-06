# Session 5 cold-read snippets and interlude (instructor only)

Reconstructed from the Session 5 rebuild outline, which says what each snippet tests. The slide images use invented book titles. **Compare with the code images before relying on these.** All four are deliberately wrong.

| Snippet | What it tests |
|---|---|
| A | `express.json()` is registered **after** the route, so `req.body` is `undefined` when the route runs. Express 5: destructuring it throws a TypeError, which becomes a 500. |
| B | `next()` is skipped on one branch of a middleware, so requests that take that branch hang forever (no response, no error). A different case from the interlude. |
| C | An omitted optional filter is bound as `NULL` into `LIKE '%' + @title + '%'`. `NULL` makes the whole pattern `NULL`, so **zero rows** come back. A request with no `?title=` returns nothing instead of everything. |
| D | The foreign-key error (547) is not caught, so a missing publisher gives a 500 where the right answer is 404 (or 400). |

`interlude-valid-and-never-answered.js` is the "Valid, And Never Answered" bug: a validation middleware that forgets `next()`.

**Not verified against a live server:** that the `mssql` driver exposes `err.number` as 2627 (primary key) and 547 (foreign key or CHECK). The Session 5 notes already flag this.
