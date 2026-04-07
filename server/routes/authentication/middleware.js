const { isSessionTokenValid } = require("../../database/functions");

async function isLoggedIn(req, res, next) {
  if (req.session.session_token) {
    const result = await isSessionTokenValid(req.session.session_token);
    if (!result) {
      req.session.destroy();

      res.status(401).render("http_codes/http", {
        pageTitle: "Unauthorized",
        httpErrCode: "401",
        httpErrMessage:
          "Either someone logged into your account from another device or you are not authorized to view the page you requested.",
      });
    }
    return next();
  } else {
    res.status(401).render("http_codes/http", {
      pageTitle: "Unauthorized",
      httpErrCode: "401",
      httpErrMessage: "You are not authorized to view the page you requested.",
    });
  }
}

module.exports = {
  isLoggedIn,
};
