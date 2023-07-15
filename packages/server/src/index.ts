import Express, { Router } from "express";
import Assistant from "@gpt-assistant/core";

/**
 * Represents the options for the Server class.
 */
export interface ServerOptions {
  port: number; // The port number on which the server should listen.
  assistant: Assistant; // The assistant instance to use.
  log?: boolean; // Indicates whether server logs should be enabled.
}

/**
 * Represents a server that handles HTTP requests.
 */
export default class Server {
  private router: Router;
  private port: number;
  private log = true;
  private assistant: Assistant;

  /**
   * Creates a new instance of the Server class.
   * @param {ServerOptions} options - The server options.
   */
  constructor({ port, log, assistant }: ServerOptions) {
    this.router = Router();
    this.Init();
    this.port = port;
    this.log = log || true;
    this.assistant = assistant;
  }

  /**
   * Initializes the different routes for the server.
   */
  public Init(): void {
    if (this.log) {
      console.info("Initializing server routes...");
    }
    this.router.get("/", (req, res) => {
      res.send({
        message:
          "Welcome to the GPT Assistant server! My name is " +
          this.assistant.Name() +
          ".",
      });
    });

    console.info("Server routes initialized.");
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

    app.use(this.router);

    return app;
  }
}
