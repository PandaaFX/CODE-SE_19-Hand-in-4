function isLoggedIn(req, res, next) {
  if (req.session.session_token) return next();
  else {
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
