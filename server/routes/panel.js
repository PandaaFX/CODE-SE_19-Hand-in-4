const express = require("express");
const { isLoggedIn } = require("./authentication/middleware");
const { securePassword } = require("../authentication/auth");
const database = require("../database/functions");
const { processAvatar, isMimeTypeValid } = require("../utils/avatar");
const router = express.Router();

router.get("/", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const userData = await database.getUserData(sessionToken);

  res.render("panel/index", {
    pageTitle: "My Account",
    user: {
      id: userData.id,
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      created_at: userData.created_at,
    },
  });
});

router.patch("/updateUserData", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;
  const updatedData = req.body;

  if (
    !updatedData ||
    (!updatedData.firstname && !updatedData.lastname && !updatedData.email)
  ) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Updated values cannot be missing or empty!",
    });
  }

  const updateResult = await database.updateUserData(
    updatedData.firstname,
    updatedData.lastname,
    updatedData.email,
    sessionToken,
  );
  if (!updateResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while updating user account data!",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
    message: "Updated data successfully",
    reload: true,
  });
});

router.put("/updateUserAvatar", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const contentType = req.headers["content-type"];
  const mimeType = contentType.split("/")[1];
  if (!isMimeTypeValid(mimeType)) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Avatar is not an image!",
    });
  }

  const newAvatar = req.body;
  if (!Buffer.isBuffer(newAvatar)) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Avatar cannot be missing or empty!",
    });
  }

  const processedAvatar = await processAvatar(newAvatar);
  if (!processedAvatar) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while processing your avatar!",
    });
  }

  const updateResult = await database.updateUserAvatar(
    processedAvatar,
    sessionToken,
  );
  if (!updateResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while updating user avatar!",
    });
  }

  return res.status(200).send({
    success: true,
    httpCode: 200,
    message: "Updated avatar successfully",
  });
});

router.patch("/changePassword", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;
  const confirmNewPassword = req.body?.confirmNewPassword;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "Make sure you filled out all fields. Try again!",
    });
  }

  const doCurrentPasswordsMatch =
    await database.verifyUserCredentialsBySessionToken(
      sessionToken,
      currentPassword,
    );

  if (!doCurrentPasswordsMatch) {
    return res.status(401).send({
      success: false,
      httpCode: 401,
      errorMessage: "Your current password is not correct!",
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).send({
      success: false,
      httpCode: 400,
      errorMessage: "New passwords do not match!",
    });
  }

  const newPasswordHashed = await securePassword(newPassword);

  const changeResult = await database.changeUserPassword(
    newPasswordHashed,
    sessionToken,
  );

  if (!changeResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while changing your password!",
    });
  }

  req.session.destroy();
  return res.redirect("/login");
});

router.delete("/deleteAccount", isLoggedIn, async function (req, res) {
  const sessionToken = req.session.session_token;

  const accountDeletionResult = await database.deleteUserAccount(sessionToken);
  if (!accountDeletionResult) {
    return res.status(500).send({
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while deleting your account!",
    });
  }

  req.session.destroy();
  return res.redirect("/register");
});

module.exports = router;
