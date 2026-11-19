-- =====================================================================
-- Session 3 demos: test data and clean-up. Run in SSMS on NPBookstore.
-- Test ISBNs start with 00000000 so they never clash with a real book.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BEFORE CLASS: clean slate + the CHECK-demo copies (slide 30)
--    Safe to run again at any time.
-- ---------------------------------------------------------------------
DELETE FROM BookCopy   WHERE ISBN LIKE '00000000%';
DELETE FROM BookAuthor WHERE ISBN LIKE '00000000%';
DELETE FROM Book       WHERE ISBN LIKE '00000000%';

INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)
  VALUES ('0000000003', 'Copy Test Book', '2026', 1, NULL);
INSERT INTO BookCopy (ISBN, CopyNo, RentalRate, Status)
  VALUES ('0000000003', 1, 3.00, 'D'), ('0000000003', 2, 3.00, 'D');

-- ---------------------------------------------------------------------
-- 2. LIVE DEMO 2, after Q1: show the orphan, then remove it
-- ---------------------------------------------------------------------
SELECT * FROM Book       WHERE ISBN = '0000000004';  -- 1 row: the orphan
SELECT * FROM BookAuthor WHERE ISBN = '0000000004';  -- 0 rows
DELETE FROM Book         WHERE ISBN = '0000000004';

-- ---------------------------------------------------------------------
-- 3. LIVE DEMO 2, after Q2 and Q3: prove what the transaction did
-- ---------------------------------------------------------------------
SELECT * FROM Book       WHERE ISBN IN ('0000000002', '0000000004');  -- only 0000000002
SELECT * FROM BookAuthor WHERE ISBN IN ('0000000002', '0000000004');  -- only 0000000002

-- ---------------------------------------------------------------------
-- 4. AFTER CLASS, and after any cold-read snippet check: run section 1 again.
-- ---------------------------------------------------------------------
