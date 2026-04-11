const express = require("express");
const { isLoggedIn } = require("../authentication/middleware");
const database = require("../../database/functions");
const router = express.Router();

router.get("/", isLoggedIn, async function (req, res) {
  res.redirect("/panel");
});

router.get("/:noteId", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;
  const noteId = req.params.noteId;
  const userAccess = await database.hasUserNoteAccess(noteId, sessionToken); // "author", "read_only", "not_found", "false"
  if (!userAccess) {
    return res.status(401).render("http_codes/http", {
      pageTitle: "Unauthorized",
      httpCode: 401,
      errorMessage: "You do not have access to see this note!",
    });
  }

  if (userAccess === "not_found") {
    return res.status(404).render("http_codes/http", {
      pageTitle: "Note not available",
      httpErrCode: "404",
      httpErrMessage:
        "Note not found! Make sure you're using the correct URL and that the file exists.",
    });
  }

  const note = await database.getNoteById(noteId);
  const collaborators = await database.getNoteCollaborators(noteId);

  const currentUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  res.status(200).render("notes/editor", {
    pageTitle: "Notes - Editor",
    currentUrl,
    noteAccess: userAccess,
    noteId,
    note: note,
    collaborators: collaborators ?? [],
  });
});

module.exports = router;
