const { getDBPool } = require("./connection");
const fs = require("fs/promises");
const path = require("path");

const sqlFilePath = path.join("server", "database", "sql", "tables.sql");

async function createTablesIfNotExists() {
  try {
    await fs.access(sqlFilePath);

    const sqlFile = await fs.readFile(sqlFilePath, "utf8");

    const pool = getDBPool();
    await pool.query(sqlFile);
    return true;
  } catch (error) {
    console.error("Failed to create database tables:", error);
    return false;
  }
}

module.exports = {
  createTablesIfNotExists,
};
