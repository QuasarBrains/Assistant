import { config } from "dotenv";
import AssistantServer from "@quasarbrains/assistant-server";
import Assistant from "@quasarbrains/assistant";
import Express from "express";
import services from "./services";
import path from "path";
import http from "http";
import { Server } from "socket.io";

config();

// * ASSISTANT STUFF
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not set, set it in a .env file.");
}

if (!process.env.WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL not set, set it in a .env file.");
}

const assistant = new Assistant({
  name: "Onyx",
  model: new Assistant.ChatModels.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    agentModel: "gpt-4",
    planningModel: "gpt-4",
  }),
  datastoreDirectory: path.join(__dirname, "datastore"),
  verbose: true,
  description: "Onyx is a personal assistant with a casual but helpful tone.",
});

assistant.ServiceManager().registerServices(services);

const PORT = Number(process.env.PORT) || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const assistantServer = new AssistantServer({
  log: true,
  assistant,
  webhook_url: WEBHOOK_URL,
});

const assistantRouter = assistantServer.Router();

// * EXPRESS STUFF
const app = Express();
const server = http.createServer(app);

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(Express.static(path.join(__dirname, "public")));

app.use("/assistant", assistantRouter);

const io = new Server(server);

io.on("connection", (socket) => {
  console.info("a client connected");
  socket.on("disconnect", () => {
    console.info("a client disconnected");
  });
});

app.post("/api/webhook", (req, res) => {
  io.emit("assistant-message", req.body.data);
  res.sendStatus(200);
});

app.post("/api/test", (req, res) => {
  res.send({
    message: "Hello world!",
  });
});

server.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
