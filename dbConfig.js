// Settings for sql.connect(). This is a plain object, not a function.
// Replace the values with your own SQL Server login.
// (Session 2 OAL moves these into a .env file so the password is not in the code.)
const dbConfig = {
  server: 'localhost',
  database: 'NP Bookstore',
  user: 'your_login',
  password: 'your_password',
  options: {
    trustServerCertificate: true, // local development
  },
};

module.exports = dbConfig;
