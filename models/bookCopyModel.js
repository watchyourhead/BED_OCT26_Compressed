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

module.exports = { updateRate };
