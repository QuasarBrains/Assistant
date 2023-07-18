import { ChannelManager } from "../channels";
import { ServiceManager } from "../services";
import { Channel, GlobalChannelMessage } from "../channels/construct";
import { OpenAIChatModel } from "./llm/chat";
import { Service } from "../services/construct";
import { Pipeline } from "./pipeline";
import { PlanOfAction } from "./agents/planofaction";
import { mkdirSync } from "fs";

export type AvailableModels = OpenAIChatModel;

export interface AssistantOptions {
  name: string;
  model: AvailableModels;
  datastoreDirectory: string;
  log?: boolean;
}

export { Service, Channel };

export default class Assistant {
  private name: string;
  private channelManager: ChannelManager;
  private serviceManager: ServiceManager;
  private model: AvailableModels;
  private pipeline: Pipeline;
  private datastoreDirectory: string;
  private log: boolean;
  public static Channel = Channel;
  public static Service = Service;
  public static PlanOfAction = PlanOfAction;
  public static ChatModels = {
    OpenAI: OpenAIChatModel,
  };

  constructor({ name, model, datastoreDirectory, log }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.datastoreDirectory = datastoreDirectory;
    this.log = log ?? true;
    this.channelManager = new ChannelManager({ assistant: this });
    this.serviceManager = new ServiceManager({ assistant: this });
    this.pipeline = new Pipeline({ assistant: this });
    this.init();
  }

  public async init() {
    await this.initDatastore();
    return true;
  }

  public Name(): string {
    return this.name;
  }

  public ChannelManager(): ChannelManager {
    return this.channelManager;
  }

  public ServiceManager(): ServiceManager {
    return this.serviceManager;
  }

  public Model() {
    return this.model;
  }

  public Pipeline() {
    return this.pipeline;
  }

  public DatastoreDirectory() {
    return this.datastoreDirectory;
  }

  public initDatastore() {
    if (this.log) {
      console.info(`Initializing datastore at ${this.datastoreDirectory}`);
    }

    mkdirSync(this.datastoreDirectory, { recursive: true });

    return this.datastoreDirectory;
  }

  public async getChatResponseSimple(message: string): Promise<string> {
    try {
      const response = await this.model.getChatResponseSimple({
        message,
        system_prompt: "You are a helpful assistant.",
      });
      return response;
    } catch (error) {
      console.error(error);
      return "An error occured.";
    }
  }

  public async getChatResponse(
    messages: GlobalChannelMessage[]
  ): Promise<GlobalChannelMessage> {
    try {
      const response = await this.model.getChatResponse({
        messages,
      });
      return response;
    } catch (error) {
      console.error(error);
      return {
        role: "system",
        content: "An error occured.",
      };
    }
  }

  public async getAssistantResponse(
    messages: GlobalChannelMessage[]
  ): Promise<GlobalChannelMessage> {
    try {
      const pipelineResponse = await this.pipeline.userMessage(messages);

      const response = pipelineResponse;

      return {
        role: "assistant",
        content: response,
      };
    } catch (error) {
      console.error(error);
      return {
        role: "system",
        content: "An error occured.",
      };
    }
  }
}
