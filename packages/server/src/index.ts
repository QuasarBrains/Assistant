import Express, { Router } from "express";
import Assistant, { Channel, GlobalChannelMessage } from "@onyx-assistant/core";
import routes from "./routes";

/**
 * Represents the options for the Server class.
 */
export interface ServerOptions {
  port: number; // The port number on which the server should listen.
  assistant: Assistant; // The assistant instance to use.
  log?: boolean; // Indicates whether server logs should be enabled.
}

interface ServerChannelMessage {
  content: string;
}

/**
 * Represents a server that handles HTTP requests.
 */
export default class Server {
  private router: Router;
  private port: number;
  private log = true;
  private assistant: Assistant;
  private serverChannel: Channel<ServerChannelMessage>;
  private serverHistory: Record<string, GlobalChannelMessage[]> = {};

  /**
   * Creates a new instance of the Server class.
   * @param {ServerOptions} options - The server options.
   */
  constructor({ port, log, assistant }: ServerOptions) {
    this.router = Router();
    this.port = port;
    this.log = log || true;
    this.assistant = assistant;
    this.serverChannel = this.createServerChannel();
    this.init();
  }

  /**
   * Initializes the different routes for the server.
   */
  public init(): void {
    this.initRoutes();
    this.initServerChannel();
  }

  /**
   * Initializes routes
   */
  public initRoutes(): void {
    if (this.log) {
      console.info("Initializing server routes...");
    }

    this.router.use((req, res, next) => {
      if (!req.body) {
        req.body = {};
      }
      req.body.server = this;
      req.body.assistant = this.assistant;
      req.body.serverChannel = this.serverChannel;
      next();
    }, routes);

    if (this.log) {
      console.info("Server routes initialized.");
    }
  }

  public defineConversationHistory(
    conversation_id: string,
    messages: GlobalChannelMessage[]
  ): void {
    this.serverHistory[conversation_id] = messages;
  }

  public getConversationHistory(conversation_id: string, count?: number) {
    if (count) {
      return this.serverHistory[conversation_id].slice(-count);
    }
    return this.serverHistory[conversation_id] || [];
  }

  public getFullConversationHistory() {
    return this.serverHistory;
  }

  /**
   * creates the server channel
   */
  public createServerChannel(): typeof this.serverChannel {
    const serverChannel = new Assistant.Channel<ServerChannelMessage>({
      name: "server",
      description:
        "Allows interaction with the user via HTTP requests. Has an endpoint open that allows for messages to be sent, and assistant replies will be sent back as responses.",
      init: () => {},
      sendMessage: (message) => {
        return message;
      },
      parseMessageToString: async (message) => {
        return message.content;
      },
      parseMessageToGlobalMessage: async (message, role) => {
        return {
          content: message.content,
          role,
        };
      },
      addToHistory: (history) => {
        this.serverHistory = {
          ...this.serverHistory,
          ...history,
        };
      },
      getFullHistory: () => {
        return this.serverHistory;
      },
      defineConversationHistory: (history) => {
        this.defineConversationHistory(
          history.conversation_id,
          history.messages
        );
      },
      getConversationHistory: (conversation_id, count) => {
        return this.getConversationHistory(conversation_id, count);
      },
    });
    return serverChannel;
  }

  /**
   * Initializes the server channel.
   */
  public initServerChannel(): void {
    this.assistant.ChannelManager().registerChannel(this.serverChannel);
  }

  /**
   * Gets the router instance associated with the server.
   * @returns {Router} The router instance.
   */
  public Router(): Router {
    return this.router;
  }

  /**
   * Creates and configures an Express application with the server's router.
   * @returns {Express.Express} The configured Express application.
   */
  public Server(): Express.Express {
    const app = Express();

    app.use(Express.json());
    app.use(Express.urlencoded({ extended: true }));

    app.use(this.router);

    return app;
  }
}
