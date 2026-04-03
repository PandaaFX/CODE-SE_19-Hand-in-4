const express = require("express");
const {
  loginAccount,
  generateSessionToken,
} = require("../../authentication/auth");
const database = require("../../database/functions");
const router = express.Router();

router.get("/", function (_req, res) {
  res.render("auth/login", {
    pageTitle: "Login",
  });
});

router.post("/", async function (req, res, next) {
  const credentials = req.body;

  const loginAccountResult = await loginAccount(credentials);

  if (loginAccountResult.httpCode === 200) {
    try {
      const sessionToken = await generateSessionToken();
      const result = await database.addSessionTokenForUser(
        credentials.email,
        sessionToken,
      );
      if (!result) throw new Error("Could not update session token for user");

      req.session.regenerate(function (err) {
        if (err) return next(err);

        req.session.session_token = sessionToken;

        if (credentials.remember === "on") {
          req.session.cookie.maxAge = parseInt(
            process.env.SESSION_COOKIE_MAX_AGE,
            10,
          );
        }

        req.session.save(function (err) {
          if (err) return next(err);
          return res.redirect("/panel");
        });
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send({
        success: false,
        httpCode: 500,
        errorMessage:
          "Something went wrong while generating session token, try again!",
      });
    }
  } else {
    return res
      .status(loginAccountResult.httpCode || 500)
      .send(loginAccountResult);
  }
});

module.exports = router;
