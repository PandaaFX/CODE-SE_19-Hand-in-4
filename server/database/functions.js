const { uuidv7 } = require("uuidv7");
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

async function isSessionTokenValid(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT 1 FROM `users` WHERE session_token = ?",
    [sessionToken],
  );

  return rows.length > 0;
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

async function getUserNotes(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `notes`.`id`, `notes`.`title`, `notes`.`author_id`, `notes`.`updated_at`, `notes`.`created_at` FROM `notes` JOIN `users` ON `notes`.`author_id` = `users`.`id` WHERE `users`.`session_token` = ?",
    [sessionToken],
  );

  return rows;
}

async function getSharedNotes(sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT DISTINCT `n`.`id`, `n`.`title`, `n`.`author_id`, `n`.`updated_at`, `n`.`created_at` FROM `notes` `n` JOIN `note_collaborators` `nc` ON `nc`.`note_id` = `n`.`id` JOIN `users` `u` ON `u`.`id` = `nc`.`user_id` WHERE `u`.`session_token` = ? ORDER BY `n`.`updated_at` DESC",
    [sessionToken],
  );

  return rows;
}

async function getNoteCollaborators(noteId) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `nc`.`note_id`, `nc`.`user_id`, `u`.`firstname`, `u`.`lastname`, `u`.`email` FROM `note_collaborators` `nc` JOIN `users` `u` ON `u`.`id` = `nc`.`user_id` WHERE `nc`.`note_id` = ? ORDER BY `u`.`firstname`, `u`.`lastname`",
    [noteId],
  );

  return rows;
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

async function insertNewNote(sessionToken) {
  const pool = getDBPool();

  const UUID_V7 = uuidv7();
  const [rows] = await pool.query(
    "INSERT INTO `notes` (id, title, author_id) SELECT ?, ?, `u`.`id` FROM `users` `u` WHERE `u`.`session_token` = ?",
    [UUID_V7, "Unnamed Note", sessionToken],
  );

  return rows.affectedRows > 0 ? UUID_V7 : false;
}

async function updateNote(noteId, title, content, sessionToken) {
  const pool = getDBPool();

  let setClauses = [];
  let dynamicValues = [];
  if (title) {
    setClauses.push("`n`.`title` = ?");
    dynamicValues.push(title);
  }
  if (content) {
    setClauses.push("`n`.`content` = ?");
    dynamicValues.push(content);
  }

  if (setClauses.length === 0) return false;

  dynamicValues.push(sessionToken);
  dynamicValues.push(noteId);

  const [rows] = await pool.query(
    `UPDATE \`notes\` \`n\` JOIN \`users\` \`u\` ON \`u\`.\`id\` = \`n\`.\`author_id\` SET ${setClauses.join(", ")} WHERE \`u\`.\`session_token\` = ? AND \`n\`.\`id\` = ?`,
    dynamicValues,
  );

  return rows.affectedRows > 0;
}

async function deleteNote(noteId, sessionToken) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "DELETE `n` FROM `notes` `n` JOIN `users` `u` ON `u`.`id` = `n`.`author_id` WHERE `u`.`session_token` = ? AND `n`.`id` = ?",
    [sessionToken, noteId],
  );

  return rows.affectedRows > 0;
}

async function addNoteCollaborator(noteId, email) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "INSERT INTO `note_collaborators` (`note_id`, `user_id`) SELECT ?, `u`.`id` FROM `users` `u` WHERE `u`.`email` = ?",
    [noteId, email],
  );

  return rows.affectedRows > 0;
}

async function removeNoteCollaborator(noteId, email) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "DELETE `nc` FROM `note_collaborators` `nc` JOIN `users` `u` ON `u`.`id` = `nc`.`user_id` WHERE `nc`.`note_id` = ? AND `u`.`email` = ?",
    [noteId, email],
  );

  return rows.affectedRows > 0;
}

async function hasUserNoteAccess(noteId, sessionToken) {
  const pool = getDBPool();

  const [noteRows] = await pool.query(
    "SELECT `author_id` FROM `notes` WHERE `id` = ?",
    [noteId],
  );

  if (noteRows.length === 0) return "not_found";

  const [userRows] = await pool.query(
    "SELECT `id` FROM `users` WHERE `session_token` = ?",
    [sessionToken],
  );

  if (userRows.length === 0) return false;

  const noteAuthorId = noteRows[0]?.author_id;
  const userId = userRows[0]?.id;

  if (userId === noteAuthorId) return "author";

  const [collaboratorRows] = await pool.query(
    "SELECT 1 FROM `note_collaborators` WHERE `note_id` = ? AND `user_id` = ?",
    [noteId, userId],
  );

  if (collaboratorRows.length > 0) return "read_only";

  return false;
}

async function getNoteById(noteId) {
  const pool = getDBPool();

  const [rows] = await pool.query(
    "SELECT `title`, `content`, `author_id`, `updated_at` FROM `notes` WHERE `id` = ?",
    [noteId],
  );

  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  checkDatabaseConnection,
  checkIfEmailExists,
  addNewUser,
  verifyUserCredentialsByEmail,
  verifyUserCredentialsBySessionToken,
  addSessionTokenForUser,
  resetSessionTokenForUser,
  isSessionTokenValid,
  getUserData,
  getUserAvatar,
  getUserNotes,
  getSharedNotes,
  getNoteCollaborators,
  updateUserData,
  updateUserAvatar,
  changeUserPassword,
  deleteUserAccount,
  insertNewNote,
  updateNote,
  deleteNote,
  addNoteCollaborator,
  removeNoteCollaborator,
  hasUserNoteAccess,
  getNoteById,
};
