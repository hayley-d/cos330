import express from "express";
import userRoutes from "./routes/user.routes";
import { app_db, migrate } from "./db/db";

const app = express();
migrate();

app.use(express.json());
app.use("/users", userRoutes(app_db));

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
