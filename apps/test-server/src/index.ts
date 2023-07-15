import { config } from "dotenv";
import AssistantServer from "@onyx-assistant/server";
import Assistant from "@onyx-assistant/core";
import Express from "express";

config();

const assistant = new Assistant({
  name: "Test Assistant",
});

const PORT = Number(process.env.PORT) || 3000;

const assistantServer = new AssistantServer({
  port: PORT,
  log: true,
  assistant,
});

const assistantRouter = assistantServer.Router();

const app = Express();

app.use("/assistant", assistantRouter);

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
