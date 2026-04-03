const mysql = require("mysql2/promise");

let pool = null;
function getDBPool() {
  if (pool) return pool;

  if (
    !process.env.DB_HOSTNAME ||
    !process.env.DB_USERNAME ||
    !process.env.DB_NAME
  ) {
    throw new Error("Database environment variables are not complete!");
  }

  const newPool = mysql.createPool({
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: true,
  });

  pool = newPool;
  return pool;
}

module.exports = {
  getDBPool,
};
