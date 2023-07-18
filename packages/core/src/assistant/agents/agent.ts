import { AgentManager } from ".";
import Assistant, { Channel } from "..";
import { JSONSchema } from "../../types/jsonschema";
import { ChatModel } from "../llm";
import { PlanOfAction } from "./planofaction";
import { randomBytes } from "crypto";

export interface AssistantOptions {
  name: string;
  model: ChatModel;
  planOfAction: PlanOfAction;
  primaryChannel: Channel;
  primaryConversationId: string;
}

export class Agent {
  private name: string;
  private model: ChatModel;
  private planOfAction: PlanOfAction;
  private manager: AgentManager | undefined;
  private primaryChannel: Channel;
  private primaryConversationId: string;

  constructor({
    name,
    model,
    planOfAction,
    primaryChannel,
    primaryConversationId,
  }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.planOfAction = planOfAction;
    this.primaryChannel = primaryChannel;
    this.primaryConversationId = primaryConversationId;
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

  public registerManager(manager: AgentManager) {
    this.manager = manager;
  }

  public getPlanOfAction() {
    return this.planOfAction;
  }

  public actionsAvailable(): JSONSchema[] {
    const services =
      this.manager?.Assistant()?.ServiceManager().getServiceList() ?? [];
    const channels =
      this.manager?.Assistant()?.ChannelManager().getChannelList() ?? [];

    return [...services, ...channels];
  }

  public publishBasicMessageToPrimaryChannel(message: string) {
    this.primaryChannel.sendMessageAsAssistant(
      {
        content: message,
      },
      this.primaryConversationId
    );
  }

  public async sendGreetingMessage() {
    // Send a message to the user on initialization
    this.publishBasicMessageToPrimaryChannel(
      `Hello! I'm ${this.FormattedAgentName()}!
      
      I have been initialized to complete the following task:
      "${this.planOfAction.Title()}"
      `
    );
  }

  public async init() {
    this.sendGreetingMessage();
  }

  public async run() {}
}
