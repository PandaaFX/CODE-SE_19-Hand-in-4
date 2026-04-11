const express = require("express");
const database = require("../database/functions");
const router = express.Router();
const path = require("path");

router.get("/", function (_req, res) {
  res.status(200).send();
});

router.get("/getUserData", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const userData = await database.getUserData(sessionToken);
  return res.status(200).send({
    success: true,
    httpCode: 200,
    data: userData,
  });
});

const DEFAULT_AVATAR_PATH = path.resolve(
  __dirname,
  "../../public/assets/images/default-avatar.jpg",
);
router.get("/avatar", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(302).sendFile(DEFAULT_AVATAR_PATH);
  }

  const userAvatar = await database.getUserAvatar(sessionToken);
  if (!userAvatar) return res.sendFile(DEFAULT_AVATAR_PATH);

  res.contentType("image/webp");
  return res.status(200).send(userAvatar);
});

router.get("/session", function (req, res) {
  res.status(200).send({
    success: true,
    httpCode: 200,
    session: req.session,
  });
});

router.post("/createNote", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const noteCreationResult = await database.insertNewNote(sessionToken);
  if (!noteCreationResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "An error occurred while creating a note!",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
    message: "Successfully created note.",
    noteId: noteCreationResult,
  });
});

router.delete("/deleteNote", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const noteId = req.body?.noteId;
  if (!noteId) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Missing field 'noteId'",
    });
  }

  const noteDeletionResult = await database.deleteNote(noteId, sessionToken);
  if (!noteDeletionResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "An error occurred while deleting a note!",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
    message: "Successfully deleted note.",
  });
});

router.put("/updateNoteTitle/:noteId", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const noteId = req.params.noteId;
  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const normalizedTitle =
    title.length > 0 ? title.slice(0, 120) : "Unnamed Note";

  const noteAccess = await database.hasUserNoteAccess(noteId, sessionToken);

  if (noteAccess === "not_found") {
    return res.status(404).send({
      success: false,
      httpCode: 404,
      errorMessage: "Note not found",
    });
  }

  if (noteAccess !== "author") {
    return res.status(403).send({
      success: false,
      httpCode: 403,
      errorMessage: "You are not allowed to update this note title",
    });
  }

  const updated = await database.updateNote(
    noteId,
    normalizedTitle,
    null,
    sessionToken,
  );

  if (!updated) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Unable to update note title",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
    title: normalizedTitle,
  });
});

router.put("/updateNoteContent/:noteId", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const noteId = req.params.noteId;
  const content = req.body?.content ? JSON.stringify(req.body.content) : null;
  if (!content) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Unable to update note title",
    });
  }

  const noteAccess = await database.hasUserNoteAccess(noteId, sessionToken);

  if (noteAccess === "not_found") {
    return res.status(404).send({
      success: false,
      httpCode: 404,
      errorMessage: "Note not found",
    });
  }

  if (noteAccess !== "author") {
    return res.status(403).send({
      success: false,
      httpCode: 403,
      errorMessage: "You are not allowed to update this note content",
    });
  }

  const updated = await database.updateNote(
    noteId,
    null,
    content,
    sessionToken,
  );

  if (!updated) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Unable to update note content",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
  });
});

router.post("/updateNotesCollaborators/:noteId", async function (req, res) {
  const sessionToken = req.session.session_token;
  if (!sessionToken) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Unauthorized",
    });
  }

  const noteId = req.params.noteId;
  const email = req.body?.email;
  console.log("🚀 ~ req.body?.email:", req.body?.email);
  if (!email) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Email not provided",
    });
  }

  const action = req.body?.action;
  if (action !== "add" && action !== "remove") {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Action invalid",
    });
  }

  const noteAccess = await database.hasUserNoteAccess(noteId, sessionToken);
  if (noteAccess === "not_found") {
    return res.status(404).send({
      success: false,
      httpCode: 404,
      errorMessage: "Note not found",
    });
  }

  if (noteAccess !== "author") {
    return res.status(403).send({
      success: false,
      httpCode: 403,
      errorMessage: "You are not allowed to update this notes collaborators",
    });
  }

  if (action === "add") {
    const updated = await database.addNoteCollaborator(noteId, email);

    if (!updated) {
      return res.status(500).send({
        success: false,
        httpCode: 500,
        errorMessage: "Unable to add note collaborator",
      });
    }
  } else if (action === "remove") {
    const updated = await database.removeNoteCollaborator(noteId, email);

    if (!updated) {
      return res.status(500).send({
        success: false,
        httpCode: 500,
        errorMessage: "Unable to remove note collaborator",
      });
    }
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
  });
});

module.exports = router;
