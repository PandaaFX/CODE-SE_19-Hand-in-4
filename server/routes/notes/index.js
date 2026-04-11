const express = require("express");
const { isLoggedIn } = require("../authentication/middleware");
const database = require("../../database/functions");
const router = express.Router();

router.get("/", isLoggedIn, async function (req, res) {
  res.redirect("/panel")
});

router.get("/:noteId", isLoggedIn, async function (req, res) {
  res.status(200).send("Got your noteId :" + req.params.noteId)
});

module.exports = router;
