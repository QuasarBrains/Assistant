import { ChannelManager } from "../channels";
import { ServiceManager } from "../services";
import { Channel, GlobalChannelMessage } from "../channels/construct";
import { OpenAIChatModel } from "./llm/chat";
import { Service } from "../services/construct";
import { Pipeline } from "./pipeline";
import { PlanOfAction } from "./agents/planofaction";
import { mkdirSync } from "fs";
import { Agent } from "./agents/agent";
import { AgentManager } from "./agents";

export type AvailableModels = OpenAIChatModel;

export interface AssistantOptions {
  // The name of the assistant.
  name: string;
  // The model to use for the assistant.
  model: AvailableModels;
  // The directory to store the assistant's data.
  datastoreDirectory: string;
  // Whether to log assistant actions and metadata.
  log?: boolean;
  // Assistant responses will be complex and verbose, mostly useful for debugging.
  verbose?: boolean;
}

export { Service, Channel };

export default class Assistant {
  private name: string;
  private channelManager: ChannelManager;
  private serviceManager: ServiceManager;
  private agentManager: AgentManager;
  private model: AvailableModels;
  private pipeline: Pipeline;
  private datastoreDirectory: string;
  private log: boolean;
  private verbose: boolean;
  public static Channel = Channel;
  public static Service = Service;
  public static PlanOfAction = PlanOfAction;
  public static Agent = Agent;
  public static ChatModels = {
    OpenAI: OpenAIChatModel,
  };

  constructor({
    name,
    model,
    datastoreDirectory,
    log,
    verbose,
  }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.datastoreDirectory = datastoreDirectory;
    this.verbose = verbose ?? false;
    this.log = log ?? true;
    this.channelManager = new ChannelManager({ assistant: this });
    this.serviceManager = new ServiceManager({ assistant: this });
    this.agentManager = new AgentManager({ assistant: this });
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

  public AgentManager(): AgentManager {
    return this.agentManager;
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

  public async initDatastore() {
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

  public async startAssistantResponse({
    messages,
    channel,
    conversation_id,
  }: {
    messages: GlobalChannelMessage[];
    channel: Channel;
    conversation_id: string;
  }): Promise<boolean> {
    try {
      const pipelineResponse = await this.pipeline.userMessage({
        messages,
        primaryChannel: channel,
        conversationId: conversation_id,
      });

      return pipelineResponse;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
