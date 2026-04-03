const express = require("express");
const database = require("../database/functions");
const router = express.Router();

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

router.get("/session", function (req, res) {
  res.status(200).send({
    success: true,
    httpCode: 200,
    session: req.session,
  });
});

module.exports = router;
