const express = require("express");
const { isLoggedIn } = require("../authentication/middleware");
const database = require("../../database/functions");
const router = express.Router();
const accountRouter = require("./account.js");

router.get("/", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const userData = await database.getUserData(sessionToken);
  const userNotes = await database.getUserNotes(sessionToken);

  res.render("panel/home", {
    pageTitle: "Home",
    user: {
      id: userData.id,
      firstname: userData.firstname,
    },
    notes: userNotes ?? [],
  });
});

router.use("/account", accountRouter);

module.exports = router;
