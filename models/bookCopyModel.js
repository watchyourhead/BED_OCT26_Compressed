// Model: every SQL query and every connection for BookCopy lives here.
// If you can see SQL, you are reading a Model.
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Returns how many rows changed: 1 if the copy exists, 0 if it does not.
async function updateRate(isbn, copyNo, rentalRate) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    request.input('rentalRate', sql.SmallMoney, rentalRate);
    const result = await request.query(
      `UPDATE BookCopy SET RentalRate = @rentalRate
       WHERE ISBN = @isbn AND CopyNo = @copyNo`
    );
    return result.rowsAffected[0];
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// Check: is this copy on the shelf? Status 'D' means available, 'M' means rented.
// Returns true or false, or null if there is no such copy at all.
async function checkAvailable(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    const result = await request.query(
      'SELECT Status FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (!result.recordset[0]) {
      return null;
    }
    return result.recordset[0].Status === 'D';
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// Write: mark the copy as rented. The Controller only calls this after the check passes.
async function markRented(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    const result = await request.query(
      `UPDATE BookCopy SET Status = 'M'
       WHERE ISBN = @isbn AND CopyNo = @copyNo`
    );
    return result.rowsAffected[0];
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

async function deleteCopy(isbn, copyNo) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), isbn);
    request.input('copyNo', sql.TinyInt, copyNo);
    const result = await request.query(
      'DELETE FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    return result.rowsAffected[0];
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

module.exports = { updateRate, checkAvailable, markRented, deleteCopy };
