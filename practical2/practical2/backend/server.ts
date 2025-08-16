import https from "https";
import express from "express";
import fs from "fs";

import userRoutes from "./routes/user.routes";
import { app_db, migrate } from "./db/db";
import {makeRequestLogger} from "./middleware/log.middleware";

const options = {
  key: fs.readFileSync("./certs/key.pem"),
  cert: fs.readFileSync("./certs/cert.pem"),
};

const app = express();

migrate();

app.use(express.json());
app.use(makeRequestLogger(app_db));
app.use("/users", userRoutes(app_db));

https.createServer(options, app).listen(3000, () => {
  console.log("HTTPS Express server running on https://localhost:3000");
});