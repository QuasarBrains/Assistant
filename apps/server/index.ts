import Express from "express";
import { config } from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { initSocketIO } from "./utils/socket.io";
import { initializeDatabase } from "./database";
import applicationRouter from "./routers/application";
import apiRouter from "./routers/api";
import { helloWorld } from "@gpt-assistant/core";

console.log(helloWorld());

config();
initializeDatabase();

const PORT = process.env.PORT || 3000;

const app = Express();

const server = http.createServer(app);
const io = new Server(server);

const connection = initSocketIO(io);

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  }
);

if (process.env.NODE_ENV === "development") {
  console.info("Development mode.");
  app.get("/check-server-is-up", (_, res) => {
    res.send({
      data: {
        ok: true,
      },
    });
  });
  app.post("/esbuild-rebuilt", () => {
    connection.emit("esbuild-rebuilt");
  });
}

app.use("/api", apiRouter);
app.use(applicationRouter);

server.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});
