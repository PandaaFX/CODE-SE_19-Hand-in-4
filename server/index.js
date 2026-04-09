require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");

const landingpageRoute = require("./routes/landingpage");
const LoginRoute = require("./routes/authentication/login");
const RegisterRoute = require("./routes/authentication/register");
const panelRoute = require("./routes/panel/index.js");
const apiRoute = require("./routes/api");

const { checkDatabaseConnection } = require("./database/functions");
const { createTablesIfNotExists } = require("./database/tables");
const { getDBPool } = require("./database/connection");
const { isLoggedIn } = require("./routes/authentication/middleware");
const { logoutGET } = require("./routes/authentication/logout");

const app = express();
const port = Number(process.env.SERVER_PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  express.raw({
    type: [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/jpe",
      "image/pjpeg",
      "image/pjp",
      "image/jfif",
      "image/webp",
    ],
    limit: "10mb",
  }),
);

const sessionStore = new MySQLStore(
  {
    createDatabaseTable: false,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
  getDBPool(),
);

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: process.env.SESSION_RESAVE,
  saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED,
  store: sessionStore,
  cookie: {},
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionOptions.cookie.secure = true;
}

app.use(session(sessionOptions));

app.use((err, req, res, next) => {
  if (err.name === "PayloadTooLargeError") {
    return res.status(413).send({
      success: false,
      httpCode: 413,
      errorMessage: "Your Avatar is too large!",
    });
  }
});

(async () => {
  const isDatabaseConnected = await checkDatabaseConnection();
  if (!isDatabaseConnected)
    throw new Error("A database connection could not be established!");
  else console.log("Database connected successfully");

  const ranCreateTables = await createTablesIfNotExists();
  if (!ranCreateTables)
    throw new Error("Database tables could not be initialized!");
  else console.log("Database tables initialized");

  sessionStore
    .onReady()
    .then(() => {
      console.log("MySQLStore ready");
    })
    .catch((error) => {
      throw new Error(error);
    });
})();

// ================= LANDINGPAGE =================
app.get("/", landingpageRoute.HomeGET);
app.get("/features", landingpageRoute.FeaturesGET);
app.get("/pricing", landingpageRoute.PricingGET);
// ================= LANDINGPAGE =================

// ============= LOGIN/REGISTRATION ==============
app.use("/login", LoginRoute);
app.use("/register", RegisterRoute);
app.get("/logout", isLoggedIn, logoutGET);
// ============= LOGIN/REGISTRATION ==============

// ==================== PANEL ====================
app.use("/panel", panelRoute);
// ==================== PANEL ====================

// ===================== API =====================
app.use("/api", apiRoute);
// ===================== API =====================

app.get("/code", (_req, res) => {
  res.redirect(301, "https://code.berlin/");
});

app.use((_req, res) => {
  res.status(404).render("http_codes/http", {
    pageTitle: "Not Found",
    httpErrCode: "404",
    httpErrMessage: "The page you requested could not be found.",
  });
});

app.listen(port, () => {
  console.log(
    `Hand-in_3 server listening on port ${port} => http://localhost:${port}`,
  );
});
