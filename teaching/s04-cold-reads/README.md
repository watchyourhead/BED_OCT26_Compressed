# Session 4 cold-read snippets (instructor only)

Reconstructed from the slide titles and speaker notes. **Compare with the code images on slides 39 to 42 before relying on them.** All four are deliberately wrong.

| Snippet | Question on the slide | Answer (from the speaker notes) |
|---|---|---|
| A | What happens if the copy is already rented? | `checkAvailable()` is awaited, but its return value is thrown away. `markRented()` always runs, even when the copy is already out. |
| B | Does this request make it past validation? | Yes. Each field passes its own check. But copyNo 2 already exists for this isbn, and PK(ISBN, CopyNo) makes the INSERT fail with a primary-key violation. Validation never asked about the pair. |
| C | What happens when this request is sent? | `RentalRate >= 2.50` is enforced by the CHECK constraint, so `setRentalRate()` throws. There is no try/catch, so the request never responds and the client hangs until it times out. |
| D | If something fails after this line, what happens to the BookAuthor row? | The Book INSERT uses `transaction.request()` but the BookAuthor INSERT uses `connection.request()`. BookAuthor commits on its own, outside the transaction. `rollback()` only undoes the Book insert. |
