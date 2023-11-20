import { AgentManager } from ".";
import Assistant, { Channel, Service } from "..";
import { DiscreteActionGroup, DiscreteActionsGrouped, Module } from "../../types/main";
import { ChatModel } from "../llm";
import { PlanOfAction } from "./planofaction";
import { randomBytes } from "crypto";
import { GlobalChannelMessage } from "../../types/main";
import { Pipeline } from "../pipeline";
import AgentService from "./services/agentService";

export interface AgentOptions {
  name: string;
  model: ChatModel;
  primaryChannel: Channel;
  primaryConversationId: string;
  actionGroup: DiscreteActionGroup;
  verbose?: boolean;
}

export class Agent {
  private name: string;
  private model: ChatModel;
  private manager: AgentManager | undefined;
  private primaryChannel: Channel;
  private primaryConversationId: string;
  private verbose: boolean;
  private agentContext: { [key: string]: string } = {};
  private pipeline: Pipeline;
  private agentService: Service;
  private actionGroup: DiscreteActionGroup;

  constructor({
    name,
    model,
    primaryChannel,
    primaryConversationId,
    verbose,
    actionGroup,
  }: AgentOptions) {
    this.name = name;
    this.model = model;
    this.primaryChannel = primaryChannel;
    this.primaryConversationId = primaryConversationId;
    this.verbose = verbose ?? false;
    this.actionGroup = actionGroup;
    this.pipeline = new Pipeline({
      assistant: this.manager?.Assistant() as Assistant,
      verbose: this.verbose,
      agent: this,
    });
    this.agentService = new AgentService({ agent: this });
  }

  public static getRandomNewName() {
    const length = 8;
    const bytes = randomBytes(length);
    const asStr = bytes.toString("hex");
    const name = asStr.slice(0, length).toUpperCase();
    return name;
  }

  public Name(): string {
    return this.name;
  }

  public FormattedAgentName(): string {
    return `Agent ${this.Name()}`;
  }

  public PrimaryChannel(): Channel {
    return this.primaryChannel;
  }

  public getAgentConversationHistory() {
    const history = this.primaryChannel.getAgentHistory(this.Name(), this.primaryConversationId);
    return history;
  }

  public registerManager(manager: AgentManager) {
    this.manager = manager;
  }

  public modulesAvailable(): Module[] {
    const services = this.manager?.Assistant()?.ServiceManager().getServiceList() ?? [];
    const channels =
      this.manager
        ?.Assistant()
        ?.ChannelManager()
        .getChannelList()
        .map((c) => {
          if (c.name === this.primaryChannel.Name()) {
            return {
              ...c,
              description: `(*PRIMARY CHANNEL) ${c.description}`,
            };
          }
          return c;
        }) ?? [];

    const others: Module[] = [
      {
        name: this.agentService.Name(),
        type: "service",
        description: this.agentService.Description(),
        schema: this.agentService.Schema(),
      },
    ];

    return [...services, ...channels, ...others];
  }

  public modulesMap(): { [key: string]: Module } {
    const modules = this.modulesAvailable();
    const map: { [key: string]: Module } = {};
    modules.forEach((m) => {
      map[m.name] = m;
    });
    return map;
  }

  public init(options?: { generate_name?: boolean }) {
    if (options?.generate_name) {
      const name = Agent.getRandomNewName();
      this.name = name;
    }
  }

  public start() {
    this.sendGreetingMessage();
  }

  public async sendPrimaryChannelMessage(message: string) {
    try {
      await this.primaryChannel.sendMessageAsAssistant(
        {
          content: `${this.FormattedAgentName()}: ${message}`,
        },
        this.primaryConversationId
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async recieveMessage() {
    try {
      const history = this.getAgentConversationHistory();
      const response = await this.startAgentResponse({
        messages: history,
      });
      return response;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async startAgentResponse({
    messages,
  }: {
    messages: GlobalChannelMessage[];
  }): Promise<boolean> {
    try {
      const pipelineResponse = await this.pipeline.userMessageToAgent({
        messages,
      });

      return !!pipelineResponse;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async sendGreetingMessage() {
    try {
      await this.sendPrimaryChannelMessage(
        `Hello! I'm ${this.FormattedAgentName()}!
        
        I have been initialized to complete the following task:
        "${this.actionGroup.name}"
        `
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public addToContext(key: string, value: string) {
    this.agentContext[key] = value;
  }

  public getContextAsString() {
    let str = "";
    Object.keys(this.agentContext).forEach((key) => {
      str += `${key}: ${this.agentContext[key]}\n`;
    });
    return str;
  }

  public async getConversationalResponse() {
    try {
      const history = this.getAgentConversationHistory();
      const response = await this.model.getChatResponse({ messages: history });
      this.sendPrimaryChannelMessage(response.content);
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
