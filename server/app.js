require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");

const landingpageRoute = require("./routes/landingpage.js");
const LoginRoute = require("./routes/authentication/login.js");
const RegisterRoute = require("./routes/authentication/register.js");
const panelRoute = require("./routes/panel/index.js");
const notesRoute = require("./routes/notes/index.js");
const apiRoute = require("./routes/api.js");

const { checkDatabaseConnection } = require("./database/functions.js");
const { createTablesIfNotExists } = require("./database/tables.js");
const { getDBPool } = require("./database/connection.js");
const { isLoggedIn } = require("./routes/authentication/middleware.js");
const { logoutGET } = require("./routes/authentication/logout.js");

const app = express();
const isTestEnv = process.env.NODE_ENV === "test";

function logStartup(message) {
  if (!isTestEnv) console.log(message);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
  else logStartup("Database connected successfully");

  const ranCreateTables = await createTablesIfNotExists();
  if (!ranCreateTables)
    throw new Error("Database tables could not be initialized!");
  else logStartup("Database tables initialized");

  sessionStore
    .onReady()
    .then(() => {
      logStartup("MySQLStore ready");
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

// ==================== NOTES ====================
app.use("/notes", notesRoute);
// ==================== NOTES ====================

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

module.exports = app;
