const express = require("express");
const { isLoggedIn } = require("../authentication/middleware");
const database = require("../../database/functions");
const router = express.Router();
const accountRouter = require("./account.js");

router.get("/", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const userData = await database.getUserData(sessionToken);

  res.render("panel/home", {
    pageTitle: "Home",
    user: {
      firstname: userData.firstname,
    },
  });
});

router.use("/account", accountRouter);

module.exports = router;
