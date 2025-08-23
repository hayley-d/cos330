import https from "https";
import express from "express";
import fs from "fs";

import userRoutes from "./routes/user.routes";
import { app_db, migrate } from "./db/db";
import { makeRequestLogger } from "./middleware/log.middleware";
import {
  documentRoutes,
  confidentialRoutes,
} from "./routes/asset.routes";
import rolesRoutes from "./routes/roles.routes";
import {imageRoutes} from "./routes/image.routes";

const options = {
  key: fs.readFileSync("./certs/key.pem"),
  cert: fs.readFileSync("./certs/cert.pem"),
};

const app = express();

migrate();

//app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(makeRequestLogger(app_db));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use("/",userRoutes(app_db));
app.use("/",rolesRoutes(app_db));
app.use("/", imageRoutes(app_db));
app.use("/", documentRoutes(app_db));
app.use("/", confidentialRoutes(app_db));

https.createServer(options, app).listen(3800, () => {
  console.log("HTTPS Express server running on https://localhost:3800");
});
