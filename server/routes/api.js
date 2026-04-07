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

module.exports = router;
