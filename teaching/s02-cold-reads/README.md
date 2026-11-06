# Session 2 cold-read snippets (instructor only)

Four short snippets, each with a bug that looks reasonable. They are **deliberately wrong or surprising**. Do not run them as part of the app.

These files are reconstructed from the speaker notes. Check them against the code images on the slides before relying on them.

All four use the same in-memory array:

```js
const authors = [
  { id: 1, name: 'Kenneth Grahame' },
  { id: 2, name: 'Bram Stoker' },
  { id: 3, name: 'Herman Melville' },
  { id: 4, name: 'Lewis Carroll' },
  { id: 5, name: 'Mary Shelley' },
];
```

| Snippet | Request | Answer |
|---|---|---|
| A | `GET /authors/3` | Always `404 { error: 'Not found' }`, even for author 3. `req.params.id` is the string `'3'`, and `'3' === 3` is false. Fix: `const id = parseInt(req.params.id)`. |
| B | `POST /authors` with body `{ "id": 6, "name": "Edgar Allan Poe" }` | Responds `201`, but `id` and `name` are `undefined`, because the route reads `req.query` and the data is in `req.body`. Nothing throws. |
| C | `GET /authors/99` | `404 { error: 'Not found' }`. This is correct. `parseInt` fixed the type, and there is no author 99. |
| D | `PUT /authors/5` with body `{ "id": 2, "name": "Mary W. Shelley" }` | Bram Stoker (id 2) is renamed. Mary Shelley (id 5) is untouched. The route finds the row with `req.body.id` instead of `req.params.id`. |

Run the cold-read routine: silent prediction, compare with a neighbour, reveal. Ask for the status code and the body, not "it works" or "it breaks".
