import express from "express";
import { config } from "dotenv";
import { helloWorld } from "@gpt-assistant/server";

config();

console.log(helloWorld());

const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", (req, res) => {
  return res.send({
    message: "Welcome to GPT Assistant!",
  });
});

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
