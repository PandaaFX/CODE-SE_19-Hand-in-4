const { getDBPool } = require("./connection");
const bcrypt = require("bcrypt");

async function checkDatabaseConnection() {
  const pool = getDBPool();
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

async function checkIfEmailExists(email) {
  const pool = getDBPool();

  const [rows] = await pool.query("SELECT 1 FROM `users` WHERE email = ?", [
    email,
  ]);

  return rows.length > 0;
}

async function addNewUser(firstname, lastname, email, hashedPassword) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "INSERT INTO `users` (firstname, lastname, email, password) VALUES (?, ?, ?, ?);",
    [firstname, lastname, email, hashedPassword],
  );

  return rows.affectedRows > 0;
}

async function verifyUserCredentialsByEmail(email, plainTextPassword) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `password` FROM `users` WHERE `email` = ?;",
    [email],
  );

  return rows.length > 0
    ? await bcrypt.compare(plainTextPassword, rows[0].password)
    : false;
}

async function verifyUserCredentialsBySessionToken(
  sessionToken,
  plainTextPassword,
) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `password` FROM `users` WHERE `session_token` = ?;",
    [sessionToken],
  );

  return rows.length > 0
    ? await bcrypt.compare(plainTextPassword, rows[0].password)
    : false;
}

async function addSessionTokenForUser(email, sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "UPDATE `users` SET `session_token` = ? WHERE `email` = ?;",
    [sessionToken, email],
  );

  return rows.affectedRows > 0;
}

async function resetSessionTokenForUser(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "UPDATE `users` SET `session_token` = NULL WHERE `session_token` = ?;",
    [sessionToken],
  );

  return rows.affectedRows > 0;
}

async function getUserData(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `id`, `firstname`, `lastname`, `email`, `created_at` FROM `users` WHERE session_token = ?",
    [sessionToken],
  );

  return rows[0];
}

async function getUserAvatar(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `avatar` FROM `users` WHERE session_token = ?",
    [sessionToken],
  );

  if (rows.length === 0) return null;

  return rows[0].avatar;
}

async function updateUserData(firstname, lastname, email, sessionToken) {
  const pool = getDBPool();

  let setClauses = [];
  let dynamicValues = [];
  if (firstname) {
    setClauses.push("`firstname` = ?");
    dynamicValues.push(firstname);
  }
  if (lastname) {
    setClauses.push("`lastname` = ?");
    dynamicValues.push(lastname);
  }
  if (email) {
    setClauses.push("`email` = ?");
    dynamicValues.push(email);
  }

  if (setClauses.length === 0) return false;

  dynamicValues.push(sessionToken);

  const [rows] = await pool.query(
    `UPDATE \`users\` SET ${setClauses.join(", ")} WHERE \`session_token\` = ?;`,
    dynamicValues,
  );

  return rows.affectedRows > 0;
}

async function updateUserAvatar(avatarBlob, sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "UPDATE `users` SET `avatar` = ? WHERE `session_token` = ?;",
    [avatarBlob, sessionToken],
  );

  return rows.affectedRows > 0;
}

async function changeUserPassword(newPasswordHashed, sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "UPDATE `users` SET `password` = ? WHERE `session_token` = ?;",
    [newPasswordHashed, sessionToken],
  );

  return rows.affectedRows > 0;
}

async function deleteUserAccount(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "DELETE FROM `users` WHERE `session_token` = ?;",
    [sessionToken],
  );

  return rows.affectedRows > 0;
}

module.exports = {
  checkDatabaseConnection,
  checkIfEmailExists,
  addNewUser,
  verifyUserCredentialsByEmail,
  verifyUserCredentialsBySessionToken,
  addSessionTokenForUser,
  resetSessionTokenForUser,
  getUserData,
  getUserAvatar,
  updateUserData,
  updateUserAvatar,
  changeUserPassword,
  deleteUserAccount,
};
