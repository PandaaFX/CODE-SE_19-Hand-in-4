require("dotenv").config();
const app = require("./app");

const port = Number(process.env.SERVER_PORT) || 3000;
app.listen(port, () => {
  console.log(
    `Hand-in_4 server listening on port ${port} => http://localhost:${port}`,
  );
});
