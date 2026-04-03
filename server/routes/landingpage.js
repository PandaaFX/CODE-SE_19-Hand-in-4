const HomeGET = (req, res) => {
  res.render("landingpage/index", {
    pageTitle: "NoteNova - Home",
    isLoggedIn: !!req.session.session_token,
  });
};

const FeaturesGET = (req, res) => {
  res.render("landingpage/features", {
    pageTitle: "NoteNova - Features",
    isLoggedIn: !!req.session.session_token,
  });
};

const PricingGET = (req, res) => {
  res.render("landingpage/pricing", {
    pageTitle: "NoteNova - Pricing",
    isLoggedIn: !!req.session.session_token,
  });
};

module.exports = {
  HomeGET,
  FeaturesGET,
  PricingGET,
};
