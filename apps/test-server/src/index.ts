import { config } from "dotenv";
import AssistantServer from "@onyx-assistant/server";
import Assistant from "@onyx-assistant/core";
import Express from "express";
import services from "./services";

config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not set, create a .env file and set it.");
}

const assistant = new Assistant({
  name: "Onyx",
  model: new Assistant.ChatModels.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: "gpt-4",
  }),
});

assistant.ServiceManager().registerServices(services);

const PORT = Number(process.env.PORT) || 3000;

const assistantServer = new AssistantServer({
  port: PORT,
  log: true,
  assistant,
});

const assistantRouter = assistantServer.Router();

const app = Express();

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use("/assistant", assistantRouter);

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
