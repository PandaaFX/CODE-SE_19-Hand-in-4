const { resetSessionTokenForUser } = require("../../database/functions");

function logoutGET(req, res, next) {
  const currentSessionToken = req.session.session_token;
  req.session.destroy(function (err) {
    if (err) return next();

    resetSessionTokenForUser(currentSessionToken);

    return res.redirect("/");
  });
}

module.exports = {
  logoutGET,
};
