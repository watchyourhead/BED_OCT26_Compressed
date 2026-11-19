-- =====================================================================
-- Session 4 demos: test data and resets. Run in SSMS on NPBookstore.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BEFORE CLASS (and after any demo): clean slate.
--    The two seed copies that start available go back to 'D'.
--    Test book 0000000003 gets copies 1 and 2 again (rate demos, Snippet B).
-- ---------------------------------------------------------------------
UPDATE BookCopy SET Status = 'D'
  WHERE (ISBN = '0099826704' AND CopyNo = 1) OR (ISBN = '0099895102' AND CopyNo = 1);

DELETE FROM BookCopy   WHERE ISBN LIKE '00000000%';
DELETE FROM BookAuthor WHERE ISBN LIKE '00000000%';
DELETE FROM Book       WHERE ISBN LIKE '00000000%';

INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
  VALUES ('0000000003', 'Copy Test Book', '2026', 1, NULL);
INSERT INTO BookCopy (ISBN, CopyNo, RentalRate, Status)
  VALUES ('0000000003', 1, 3.00, 'D'), ('0000000003', 2, 3.00, 'D');

-- ---------------------------------------------------------------------
-- 2. RESET ONE RENTED COPY between rent demos (or send the /return request)
-- ---------------------------------------------------------------------
UPDATE BookCopy SET Status = 'D' WHERE ISBN = '0099826704' AND CopyNo = 1;

-- ---------------------------------------------------------------------
-- 3. LOOK at the copy you are renting
-- ---------------------------------------------------------------------
SELECT ISBN, CopyNo, RentalRate, Status FROM BookCopy WHERE ISBN = '0099826704';
