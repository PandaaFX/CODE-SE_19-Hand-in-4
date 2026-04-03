const express = require("express");
const { registerNewAccount } = require("../../authentication/auth");
const router = express.Router();

router.get("/", function (_req, res) {
  res.render("auth/register", {
    pageTitle: "Registration",
  });
});

router.post("/", async function (req, res) {
  const credentials = req.body;

  const registerAccountResult = await registerNewAccount(credentials);

  if (registerAccountResult.httpCode === 201) {
    return res.redirect("/login");
  }

  return res
    .status(registerAccountResult.httpCode || 500)
    .send(registerAccountResult);
});

module.exports = router;
