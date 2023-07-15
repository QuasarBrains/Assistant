import Assistant from "@onyx-assistant/core";
import { Request, Router } from "express";
import Server from "..";

const router: Router = Router();

const getBodyFeatures = (req: Request) => {
  return {
    server: req.body.server as Server,
    assistant: req.body.assistant as Assistant,
    serverChannel: req.body.serverChannel as Server["serverChannel"],
  };
};

router.get("/", (req, res) => {
  const { assistant } = getBodyFeatures(req);
  res.send({
    message:
      "Welcome to the GPT Assistant server! My name is " +
      assistant.Name() +
      ".",
  });
});

router.post("/message", async (req, res) => {
  try {
    const { serverChannel } = getBodyFeatures(req);
    const message = req.body.message;

    serverChannel.recieveMessage({
      content: message,
    });

    return res.send({
      message: "Message recieved.",
      data: {
        original_message: message,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal server error.",
    });
  }
});

export default router;
