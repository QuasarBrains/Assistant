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
    const message = req.body.message as string;
    const conversation_id =
      req.body.conversation_id || req.query.conversation_id;

    if (!message) {
      return res.status(400).send({
        message: "No message provided.",
      });
    }

    if (!conversation_id) {
      return res.status(400).send({
        message:
          "No conversation_id provided. Add conversation_id to the query string or body.",
      });
    }

    const started = await serverChannel.startAssistantResponse({
      message: {
        role: "user",
        content: message,
      },
      conversation_id,
    });

    if (!started) {
      return res.status(500).send({
        message: "Internal server error.",
      });
    }

    return res.send({
      message: "Message recieved.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal server error.",
    });
  }
});

router.get("/history", (req, res) => {
  try {
    const { serverChannel } = getBodyFeatures(req);
    const conversation_id =
      req.body.conversation_id || req.query.conversation_id;
    if (conversation_id) {
      const history = serverChannel.getConversationHistory(conversation_id);
      return res.send({
        message: "Conversation history retrieved.",
        data: history,
      });
    }
    const history = serverChannel.getFullHistory();

    return res.send({
      message: "Full conversation history retrieved.",
      data: history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal server error.",
    });
  }
});

export default router;
